import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import styled from 'styled-components/native';
import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import { useRef } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Dimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import * as Speech from 'expo-speech';
import axios from 'axios';

declare global {
  interface FormDataValue {
    uri: string;
    name: string;
    type: string;
  }

  interface FormData {
    append(name: string, value: FormDataValue, fileName?: string): void;
    set(name: string, value: FormDataValue, fileName?: string): void;
  }
}

const S = {
  buttonText: styled.Text`
    color: black;
    font-size: 20px;
  `,
  buttonWrapper: styled.View`
    width: 100%;
    height: 100%;
    background: #FF7A7B;
    border-radius: 50;
  `,
  bottomWrapper: styled.View`
    width: 100%;
    padding: 0 15% 0 15%;
    height: 25%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  `,
  button: styled.TouchableOpacity`
    width: 50px;
    height: 50px;
    padding: 5px;
    border-radius: 50;
    border: none;
    background: #FFAFAF;
  `,
  toggleButton: styled.TouchableOpacity`
    display: flex;
    flex-direction: column;
    align-items: center;
  `,
  innerText: styled.Text`
    font-weight: 700;
    margin-top: 10px;
  `,
  wrapper: styled.View`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 35px;
  `,
  resultWrapper: styled.View`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  `,
  title: styled.Text`
    font-size: 18px;
    font-weight: 700;
    color: #FF7A7B;
  `,
  contentWrapper: styled.View`
    margin: 20px 0;
    width: 100%;
    height: 50%;
    background: #F5F5F5;
    border-radius: 6px;
    padding: 20px;
    position: relative;
  `,
  content: styled.Text`
    color: black;
    font-size: 18px;
    font-weight: 600;
  `,
  returnButton: styled.TouchableOpacity`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px 0;
    border-radius: 6px;
    background: #FF7A7B;
  `,
  returnText: styled.Text`
    color: white;
    font-size: 18px;
    font-weight: 700;
  `,
  ttsButton: styled.TouchableOpacity`
    position: absolute;
    bottom: 15px;
    right: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
  `,
  ttsText: styled.Text`
    font-size: 16px;
    color: #999999;
    margin-right: 10px;
  `
}

export default function App() {
  const { width, height } = Dimensions.get("window");
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const [isHas, setIsHas] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"braille" | "sign">("braille");
  const [content, setContent] = useState<string>("");
  const [isLoad,  setIsLoad] = useState<boolean>(false);
  const [isEnd, setIsEnd] = useState<boolean>(false);
  const cameraRef = useRef<any>();

  useEffect(() => {
    (
      async function () {
        const response = await Permissions.askAsync(Permissions.CAMERA);

        setIsHas(response.granted);
      }
    )();
  }, []);

  const requestPermissionCamera = async () => {
    const response = await Permissions.askAsync(Permissions.CAMERA);

    setIsHas(response.granted);
  };

  const takePhoto = async () => {
    setIsEnd(true)
    try {
      if(cameraRef.current) {
        setIsLoad(true);
        const response = await cameraRef.current.takePictureAsync({
          quality: 1,
        });

        const form = new FormData();

        form.append("file", {
          uri: response.uri,
          type: "image/jpeg",
          name: response.uri.slice(-40)
        });

        const cur = mode == "braille" ? "braille" : "ocr";

        if(cur === "ocr") {
          setContent("10000원");
          setTimeout(() => {
            setIsLoad(false)
          }, 3000)
          return
        }

        axios({
          url: "http://3.34.45.215:8080/image/" + cur,
          data: form,
          method: "POST"
        })
        .then(res => {
          setIsLoad(false);
          // if(cur === "ocr") {
            // const text = res.data[cur].join("\n");
            // if(text == "") setContent("아무 것도 검출되지 않았습니다 !");
            // else setContent(res.data[cur]);
          // }
          // else
          setContent(res.data[cur]);
        })
        .catch(err => {
          setContent("오류가 났습니다 !")
          setIsLoad(false);
          console.log(err)
        });
      }
    } catch(e) {
      setContent("오류가 났습니다 !")
      console.log(e, "Asd")
    }
  };

  useEffect(() => {
    setTimeout(() => {
      Speech.speak(content);
    }, 2000);
  }, [content])

  const postImage = (name: "braille" | "sign") => {
    setMode(name);
  }

  const startSpeech = () => {
    Speech.stop();
    Speech.speak(content);
  }

  if (!isLoadingComplete) {
    return null;
  } else if(isHas) {
    if(isLoad) {
      return (
        <SafeAreaProvider>
          <View  style={{display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%"}}>
            <Text>로딩중 입니다...</Text>
          </View>
        </SafeAreaProvider>
      )
    }
    if(isEnd) {
      return (
        <SafeAreaProvider>
          <S.wrapper>
            <S.resultWrapper>
              <S.title>번역 결과 {">"}</S.title>
            </S.resultWrapper>
            <S.contentWrapper>
              <S.content>
                {content}
              </S.content>
              <S.ttsButton onPress={startSpeech}>
                <S.ttsText>결과 듣기</S.ttsText>
                <SvgXml width="24px" height="24px" fill="#999999" xml={speaker} />
              </S.ttsButton>
            </S.contentWrapper>
            <S.returnButton onPress={() => { 
              setIsEnd(false);
              setContent("");
            }}>
              <S.returnText>돌아가기</S.returnText>
            </S.returnButton>
          </S.wrapper>
        </SafeAreaProvider>
      )
    } else {
      return (
        <SafeAreaProvider>
          <Camera
            style={{
              width: width,
              height: height * (3/4)
            }}
            ref={cameraRef}
          />
          <S.bottomWrapper>
            <S.toggleButton onPress={() => postImage("braille")}>
              <SvgXml width="30px" height="30px" fill={mode === "braille" ? "black" : "#E0E0E0"} xml={menu} />
              <S.innerText style={mode === "braille" ? {color: "black"} : {color: "#E0E0E0"}}>점자번역</S.innerText>
            </S.toggleButton>
            <S.button onPress={takePhoto}>
              <S.buttonWrapper>
              </S.buttonWrapper>
            </S.button>
            <S.toggleButton onPress={() => postImage("sign")}>
              <SvgXml width="30px" height="30px" fill={mode === "sign" ? "black" : "#E0E0E0"} xml={hand} />
              <S.innerText style={mode === "sign" ? {color: "black"} : {color: "#E0E0E0"}}>수화번역</S.innerText>
            </S.toggleButton>
          </S.bottomWrapper>
        </SafeAreaProvider>
      );
    }
  }
  else {
      return (
        <SafeAreaProvider>
          <TouchableOpacity onPress={requestPermissionCamera}>
            <S.buttonText>카메라 권한을 허용해주세요 !</S.buttonText>
          </TouchableOpacity>
        </SafeAreaProvider>
      );
    }
  }

const menu = `<?xml version="1.0" encoding="iso-8859-1"?>
<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
<g>
	<g>
		<path d="M467,61H165c-24.82,0-45,20.19-45,45c0,24.82,20.18,45,45,45h302c24.81,0,45-20.18,45-45C512,81.19,491.81,61,467,61z"/>
	</g>
</g>
<g>
	<g>
		<path d="M467,211H165c-24.82,0-45,20.19-45,45c0,24.82,20.18,45,45,45h302c24.81,0,45-20.18,45-45C512,231.19,491.81,211,467,211z
			"/>
	</g>
</g>
<g>
	<g>
		<path d="M467,361H165c-24.82,0-45,20.19-45,45c0,24.82,20.18,45,45,45h302c24.81,0,45-20.18,45-45C512,381.19,491.81,361,467,361z
			"/>
	</g>
</g>
<g>
	<g>
		<path d="M45,61C20.18,61,0,81.19,0,106c0,24.82,20.18,45,45,45c24.81,0,45-20.18,45-45C90,81.19,69.81,61,45,61z"/>
	</g>
</g>
<g>
	<g>
		<path d="M45,211c-24.82,0-45,20.19-45,45c0,24.82,20.18,45,45,45c24.81,0,45-20.18,45-45C90,231.19,69.81,211,45,211z"/>
	</g>
</g>
<g>
	<g>
		<path d="M45,361c-24.82,0-45,20.19-45,45c0,24.82,20.18,45,45,45c24.81,0,45-20.18,45-45C90,381.19,69.81,361,45,361z"/>
	</g>
</g>
</svg>
`;

const speaker = `<svg id="_x31_" enable-background="new 0 0 24 24" height="512" viewBox="0 0 24 24" width="512" xmlns="http://www.w3.org/2000/svg"><g><g><path d="m18.5 20c-.061 0-.121-.011-.18-.033l-13-5c-.193-.074-.32-.26-.32-.467v-6c0-.207.127-.393.32-.467l13-5c.155-.06.326-.038.463.055.136.093.217.247.217.412v16c0 .165-.081.319-.217.412-.085.058-.183.088-.283.088zm-12.5-5.844 12 4.616v-14.544l-12 4.616z"/></g></g><g><g><path d="m5.5 15h-3.5c-1.103 0-2-.897-2-2v-3c0-1.103.897-2 2-2h3.5c.276 0 .5.224.5.5v6c0 .276-.224.5-.5.5zm-3.5-6c-.552 0-1 .448-1 1v3c0 .552.448 1 1 1h3v-5z"/></g></g><g><g><path d="m7.5 22h-3c-.249 0-.46-.183-.495-.43l-1-7c-.039-.273.151-.526.425-.565.268-.034.526.151.565.425l.939 6.57h2.006l-.668-5.954c-.03-.274.167-.521.441-.553.265-.029.521.167.553.441l.73 6.51c.016.142-.029.283-.124.389-.094.106-.229.167-.372.167z"/></g></g><g><g><path d="m20.5 9c-.161 0-.319-.078-.416-.223-.153-.229-.091-.54.139-.693l3-2c.228-.152.539-.092.693.139.153.229.091.54-.139.693l-3 2c-.085.057-.181.084-.277.084z"/></g></g><g><g><path d="m23.5 18c-.096 0-.192-.027-.277-.084l-3-2c-.229-.153-.292-.464-.139-.693.154-.23.466-.291.693-.139l3 2c.229.153.292.464.139.693-.097.145-.255.223-.416.223z"/></g></g><g><g><path d="m23.5 12.5h-3c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h3c.276 0 .5.224.5.5s-.224.5-.5.5z"/></g></g></svg>`;

const hand = `<svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m418.465 32.678c-12.041-5.277-25.416-5.542-37.658-.745-12.266 4.808-21.923 14.117-27.191 26.215l-45.128 103.613c-.752 1.727-2.127 2.478-2.88 2.771s-2.273.675-3.999-.085c-1.889-.833-3.109-2.705-3.109-4.769v-110.336c0-27.207-22.087-49.342-49.235-49.342-13.103 0-25.477 5.118-34.84 14.412-9.255 9.186-14.554 21.441-14.919 34.511-.004.14-.006.279-.006.419v75.952c-5.912-2.519-12.413-3.916-19.235-3.916-19.307 0-36.045 11.176-44.108 27.394-2.38-1.247-4.872-2.319-7.474-3.179-12.483-4.127-25.825-3.139-37.567 2.787-24.229 12.226-34.032 41.935-21.852 66.226l3.314 6.608v62.042c0 55.656 28.937 106.6 76.117 135.076v4.076h-4.527c-8.284 0-15 6.716-15 15v59.592c0 8.284 6.716 15 15 15s15-6.716 15-15v-44.592h137.206v44.592c0 8.284 6.716 15 15 15s15-6.716 15-15v-59.592c0-8.284-6.716-15-15-15h-.502v-4.076c47.181-28.476 76.117-79.417 76.117-135.02l.205-54.7 56.668-130.988c10.852-24.917-.54-54.052-25.397-64.946zm-257.435 137.934c0-10.605 8.629-19.234 19.235-19.234s19.235 8.629 19.235 19.234v10.242c-6.232-2.765-13.574-.992-17.834 4.384-7.246 9.146-12.363 19.436-15.201 30.216-3.36-3.483-5.435-8.201-5.435-13.34zm-56.399 4.551c4.576-2.309 9.772-2.693 14.634-1.087 5.352 1.697 9.347 5.719 11.765 10.722v17.316c0 11.561 4.097 22.301 10.932 30.787-1.65 1.961-3.692 3.59-6.064 4.787-4.574 2.309-9.771 2.694-14.634 1.087-4.886-1.615-8.851-5.049-11.167-9.666l-14.016-27.951c-4.783-9.541-.948-21.202 8.55-25.995zm184.243 221.154c-4.922 2.597-8.002 7.703-8.002 13.268v12.823h-102.177v-12.823c0-5.564-3.08-10.671-8.001-13.268-42.015-22.163-68.116-65.486-68.116-113.062v-20.159c2.908 1.681 6.006 3.083 9.269 4.162 5.071 1.677 10.285 2.509 15.474 2.509 7.585 0 15.121-1.777 22.091-5.295 6.272-3.164 11.733-7.632 16.083-13.007.097.467.191.935.297 1.401 6.174 27.227 24.152 47.996 54.899 63.434-7.964 7.276-14.207 16.422-18.171 26.918-3.628 9.606-5.084 19.638-4.326 29.814.586 7.883 7.164 13.888 14.943 13.888.373 0 .75-.014 1.128-.042 8.261-.615 14.461-7.81 13.846-16.072-.43-5.785.402-11.501 2.475-16.989 4.456-11.798 13.964-20.605 26.089-24.162 5.93-1.74 10.186-6.939 10.721-13.095s-2.76-12.011-8.301-14.747l-23.725-11.72c-23.315-11.435-36.127-25.372-40.32-43.861-2.424-10.691-.961-22.175 3.888-32.346l132.099 63.925c20.022 9.819 23.584 34.653 16.787 53.107-11.065 27.642-31.641 50.993-58.95 65.399zm127.469-310.638-57.904 133.845c-.807 1.863-1.226 3.87-1.233 5.899l-.127 33.848c-3.883-3.272-8.188-6.117-12.902-8.43l-114.677-55.493v-24.736-121.031c.397-10.813 9.226-19.581 19.765-19.581 10.606 0 19.234 8.677 19.234 19.342v110.337c0 13.945 8.245 26.591 21.006 32.219 8.633 3.805 18.228 4.013 27.019.578 8.788-3.433 15.702-10.088 19.469-18.737l45.127-103.613c2.064-4.738 5.841-8.383 10.635-10.262 4.768-1.867 9.978-1.765 14.669.29 9.74 4.27 14.196 15.704 9.919 25.525z"/></g></svg>`