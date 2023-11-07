import ProfileImage from '@components/common/ProfileImage';
import NicknameInput from '@components/common/NicknameInput';
import {
  Dispatch,
  InputHTMLAttributes,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import ProfileChangeButton from '@components/common/ProfileChangeButton';
import Button from '@components/common/Button';
import Text from '@components/common/Text';
import IconButton from '@components/common/IconButton';
import { getMyInfo, modifyUserInfo, checkNickname } from '@api/user/user';

interface NicknameSettingProps extends InputHTMLAttributes<HTMLInputElement> {
  theme?: 'light' | 'dark';
  openModal: (open: boolean) => void;
}

export default function NicknameSetting({
  theme = 'light',
  openModal,
}: NicknameSettingProps) {
  // oldUserInfo: 변경 전 사용자의 정보
  const [oldUserInfo, setOldUserInfo] = useState({
    nickname: '',
    profileImage: '',
  });
  useEffect(() => {
    const getUserInfoEditPage = async () => {
      const result = await getMyInfo(); // 내 정보 받아오기 -> oldUserInfo에 저장
      if (result) {
        setOldUserInfo({
          nickname: result.nickname,
          profileImage: result.profileUrl,
        });
      }
    };
    getUserInfoEditPage();
  }, []);

  // newNickname: 변경할 닉네임, default 값은 변경 전 닉네임
  const [newNickname, setNewNickname] = useState(oldUserInfo.nickname);
  // 변화가 감지되었을 때 변화된 값을 newNickname에 저장
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewNickname(e.target.value);
  };
  let isPossible = true;
  // isPos: 닉네임 중복 검사 결과
  const [isPos, setIsPos] = useState(true);
  // 닉네임 중복 검사
  const isChangeable = async (newNickname: string) => {
    // 닉네임 중복 검사 값을 isPossible에 저장
    const res = await checkNickname(newNickname);
    isPossible = res.isValid;
    setIsPos(isPossible);
  };
  useEffect(() => {
    isChangeable(newNickname);
  }, [newNickname]);

  // const imageRef = useRef<HTMLInputElement>(null);
  // const handleProfileImageChangeClick = () => {
  //   if (imageRef.current) {
  //     imageRef.current.click();
  //   }
  // };
  // const handleImageInput = () => {
  //   console.log('[이미지 업로드 로직]');
  // };

  const [imageUrl, setImageUrl] = useState(oldUserInfo.profileImage);

  // const handleFileChange = async (event) => {
  //   const file = event.target.files[0];
  //   const { url } = await uploadToS3(file);

  //   setImageUrl(url);
  // };
  function uploadFile(): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div
      className={`${THEME_VARIANTS[theme]} w-132 shadow-md border text-center rounded-md justify-center p-5`}
    >
      <div className="flex justify-center relative">
        <Text type="h1">개인정보 수정</Text>

        <div className="absolute inset-y-0 right-0">
          <IconButton
            onClick={() => openModal(false)}
            theme={theme}
            name="Close"
          />
        </div>
      </div>

      <div className="grid place-items-center">
        <div className="mt-7 flex flex-row">
          <div className="mr-12 text-lg font-bold">
            <Text type="h4">프로필</Text>
          </div>
          <div className="mt-1 pr-28">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute">
                <ProfileImage src={oldUserInfo.profileImage} size={100} />
              </div>
              <div className="absolute right-4 bottom-2 h-14">
                <ProfileChangeButton
                  theme={theme}
                  onClick={uploadFile}
                  // onInput={() => handleFileChange}
                  onChange={() => console.log('dk')}
                  // ref={imageRef}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid place-items-center">
        <div className="flex flex-row justify-center items-center">
          <div className="mr-12 mt-3 text-lg font-bold">
            <Text type="h4">닉네임</Text>
          </div>
          <div className="mt-4 flex flex-col">
            <NicknameInput
              theme={theme}
              nickname={oldUserInfo.nickname}
              onChange={handleChange}
            />
            {isPos ? (
              <Text className="mt-1 text-left text-xs text-green-600">
                사용 가능한 닉네임입니다
              </Text>
            ) : (
              <Text className="mt-1 text-left text-xs text-red-500">
                사용 불가능한 닉네임입니다
              </Text>
            )}
          </div>
        </div>
      </div>

      <div className="mt-7 mb-2">
        <Button
          onClick={() => {
            modifyUserInfo(newNickname, imageUrl);
            openModal(false);
          }}
          disabled={isPos ? false : true}
          label="저장하기"
          color="blue"
        />
      </div>
    </div>
  );
}

const THEME_VARIANTS = {
  light: 'bg-white',
  dark: 'bg-dark-background-page text-white',
};
