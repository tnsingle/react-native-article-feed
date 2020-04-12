import React, { Component } from 'react';
import { useState } from 'react';
import { FlatList, Dimensions, StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Platform, Share, ActivityIndicator } from 'react-native';
import { styled } from '@shipt/react-native-tachyons';
import { build } from '@shipt/react-native-tachyons';
import {NavigationContainer} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HTML from 'react-native-render-html';
import { FontAwesome } from '@expo/vector-icons';
import moment from "moment";
import { Linking } from 'expo';

import { NYTIMES_API_ID } from 'react-native-dotenv'
import { NYTIMES_API_KEY } from 'react-native-dotenv'
import { NYTIMES_API_SECRET} from 'react-native-dotenv'
import { NYTIMES_STATIC_IMAGES } from 'react-native-dotenv'

const Stack = createStackNavigator();

// define your rem
const rem = 16;

const styles = {
    'f-small': { fontSize: 10 },
    'f-tiny': { fontSize: 8 },
};

// Run build
build({
    rem,
    styles
});


const Tag = styled(Text)`ttu f-small gray bold`
const Headline = styled(Text)`bold f3`;
const Author = styled(Text)`bold f-small`;
const Magazine = styled(Text)`gray bold f-small`;
const Timestamp = styled(Text)`f-small`;

const PromoContainer = styled(View)`mh3 pv3 bb`;
const TouchablePromoContainer = styled(TouchableOpacity)`flx-row flx-wrap`;
const PromoImageContainer = styled(View)`wp30 pr2`;
const PromoTextContainer = styled(View)`flx-i`;

const IconsContainer = styled(View)`flx-i flx-row jcsb wp50`;
const PromoIcon = styled(FontAwesome)`f3 mt3 black`;

const PageTitle = styled(Text)`bold f5`;
const PageSubTitle = styled(Text)`f4 gray`;

function updateBookmarksState(bookmarks){
    this.setState({bookmarks})
}

function getBookmarks(){
    return this.state.bookmarks;
}

function setData(data){
    this.setState({data})
}

function getData(){
    return this.state.data;
}

function setLoading(loading){
    this.setState({loading})
}

function isLoading(){
    return this.state.loading;
}

function Item({ item, navigation }) {
    const headline=item.headline.main;
    const subject= item.section_name || item.document_type;
    const author= item.byline.original;
    const magazine= item.source;
    const date= item.pub_date;

    const imageMap = item.multimedia.filter((i) => i.width <= 300).map(({width, height, url}) => ({width, height, url}));

    let image = imageMap[0];
    let imageurl = '';
    let imageWidth = 300;
    let imageHeight = 250;
    const canonicalUrl = item.web_url;

    const [isBookmarked, setIsBookmarked] = useState(false);

    //console.log(isBookmarked);

    if(image){
        imageurl = NYTIMES_STATIC_IMAGES + image.url;
        imageWidth = image.width;
        imageHeight = image.height;
    }

    // https://blog.yikkok.com/2019/08/22/bookmark-action-in-react-native-using-flatlist/
    let handleBookmark = (id) => {
        const tmpBookmarks = new Set(getBookmarks());

        if (tmpBookmarks.has(id)) {
            tmpBookmarks.delete(id); // remove it, if existed in the bookmarks
            setIsBookmarked(false);
        } else {
            tmpBookmarks.add(id); // otherwise, add into the bookmarks
            setIsBookmarked(true);
        }

        updateBookmarksState(new Set(tmpBookmarks));
    }

    return (

        <PromoContainer>
            <TouchablePromoContainer onPress={() => Linking.openURL(canonicalUrl)}>

                <PromoImageContainer>
                    <Image
                        style={{flex: 1, aspectRatio: 1.5,
                            resizeMode: 'contain', maxWidth: "100%"}}
                        source={{uri: imageurl}}
                    />
                    <IconsContainer>
                        <TouchableOpacity style={{flex: 1}} onPress={() => handleBookmark(item.id)}>
                            <PromoIcon name={isBookmarked ? 'bookmark' : 'bookmark-o'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() =>
                            Share.share({
                                ...Platform.select({
                                    ios: {
                                        message: headline + ' | ' + magazine,
                                        url: canonicalUrl,
                                    },
                                    android: {
                                        message: headline + ' | ' + magazine + '\n' + canonicalUrl
                                    }
                                }),
                            }, {
                                ...Platform.select({
                                    ios: {
                                        // iOS only:
                                        excludedActivityTypes: [
                                            'com.apple.UIKit.activity.PostToTwitter'
                                        ]
                                    },
                                    android: {
                                        // Android only:
                                        dialogTitle: 'Share : ' + headline
                                    }
                                })
                            })
                        }>
                            <PromoIcon name={'share-alt'} />
                        </TouchableOpacity>
                    </IconsContainer>

                </PromoImageContainer>

            <PromoTextContainer>
                <Tag>{subject}</Tag>
                <Headline>{headline}</Headline>
                <Text>
                    <Author>{author}</Author><Text> // </Text><Magazine>{magazine}</Magazine>
                </Text>
                <Timestamp>{moment(date).fromNow()}</Timestamp>
            </PromoTextContainer>


            </TouchablePromoContainer>
        </PromoContainer>
    );
}

function DefaultScreen({ navigation, route }){
    const data = getData();
    return (
        <View style={{flex: 1, backgroundColor: '#ffffff'}}>
            <FlatList
                data={data}
                renderItem={({item}) => (
                    <Item
                        item = { item }
                        navigation = { navigation }
                    />
                )}
                keyExtractor={item => item.id}
            />
        </View>
    );
}

function ItemScreen({ route, navigation }){
    const { pageTitle } = route.params;
    const { subTitle } = route.params;
    const {body} = route.params;

    //console.log(body);
    return (
        <ScrollView style={{flex: 1,backgroundColor: '#ffffff'}}>
            <View style={{padding: 15}}>
                <PageTitle>{pageTitle}</PageTitle>
                <PageSubTitle>{subTitle}</PageSubTitle>
                <HTML html={"<div>" + body + "</div>"} imagesMaxWidth={Dimensions.get('window').width}
                      tagsStyles={{p:{fontSize:18, marginTop: 20}, a:{fontSize:18}}}/>
            </View>

        </ScrollView>

    );
}

export default class App extends React.Component{

    constructor() {
        super();

        this.state = {
            bookmarks: new Set([]), // initialize to Set instead of Array
            data: new Set([]),
            loading: true
        }

        updateBookmarksState = updateBookmarksState.bind(this);
        getBookmarks = getBookmarks.bind(this);
        getData = getData.bind(this);
        setData = setData.bind(this);
        isLoading = isLoading.bind(this);
        setLoading = setLoading.bind(this);
    }





    async componentDidMount() {
        await fetch('https://api.nytimes.com/svc/search/v2/articlesearch.json?fl=document_type,source,news_desk,multimedia,pub_date,byline,web_url,subject,headline,section_name&sort=newest&api-key=' + NYTIMES_API_KEY)
            .then(response => response.json())
            .then(data => {
                setData(data.response.docs)
                setLoading(false)
            })
            .catch((error) => console.error(error));
    }


    render(){

        const {  loading } = this.state;



        if(!loading) {
            return <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen name="Home" component={DefaultScreen} />
                    <Stack.Screen name="Page" component={ItemScreen} options={({ route }) => ({ title: route.params.magazine })}/>
                </Stack.Navigator>
            </NavigationContainer>
        } else {
            return <ActivityIndicator />
        }


    }
}

