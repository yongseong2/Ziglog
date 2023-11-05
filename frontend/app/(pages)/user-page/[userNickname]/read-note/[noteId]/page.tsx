'use client';
import { useParams } from 'next/navigation';
import Text from '@components/common/Text';
import SvgIcon from '@components/common/SvgIcon';
import Button from '@components/common/Button';
import BookmarkQuoteInfo from '@components/userPage/BookmarkQuoteInfo';
import MarkdownPreview from '@uiw/react-markdown-preview';
import QuotationListBox from '@components/userPage/QuotationListBox';
import { NoteInfo } from '@api/note/types';
import { deleteNote, getNoteInfo, getReferenceList } from '@api/note/note';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@store/store';
import { NoteRefListInfo } from '@api/note/types';
import './page.css';
import { showAlert } from '@src/util/alert';

export default function ReadNote() {
  const { theme, isLogin } = useAppSelector((state) => state.user);
  const [quotationInfo, setQuotationInfo] = useState<NoteRefListInfo>({
    quotationList: [],
  });
  const params = useParams();
  const paramNoteId = decodeURIComponent(params.noteId as string);
  const nickname = decodeURIComponent(params.userNickname as string);
  const [hasAccess, setHasAccess] = useState(false);
  const [data, setData] = useState<NoteInfo>({
    noteId: 1,
    title: '글제목',
    content: '글내용',
    nickname: '작성자',
    isPublic: false,
    bookmarkCount: 1,
    postTime: new Date('2023-10-31 00:00:00'),
    editTime: new Date('2023-10-31 00:00:00'),
  });
  useEffect(() => {
    const getNoteReadPage = async (noteId: number) => {
      const result = await getNoteInfo(noteId, isLogin);
      if (result.statusCode === 200) {
        setHasAccess(true);
        setData({
          ...data,
          noteId: result.data.noteId,
          title: result.data.title,
          content: result.data.content,
          nickname: result.data.nickname,
          isPublic: result.data.isPublic,
          bookmarkCount: result.data.bookmarkCount,
          postTime: result.data.postTime,
          editTime: result.data.editTime,
        });
        getQuotationList(parseInt(paramNoteId));
      } else {
        showAlert(`${result.message}`, 'success');
        window.location.replace(`/user-page/${nickname}`);
      }
    };
    const getQuotationList = async (noteId: number) => {
      const result = await getReferenceList(noteId);
      if (result) {
        setQuotationInfo(result);
      }
    };
    getNoteReadPage(parseInt(paramNoteId));
  }, []);

  const isMine = true;
  return (
    hasAccess && (
      <div id="sidebar-scroll" className="overflow-y-auto h-full">
        <div className="mx-40 my-12">
          <Text type="h1">{data.title}</Text>
          <div className="flex flex-row place-items-center my-4">
            <Text type="b">{data.nickname}</Text>
            <Text className="mx-3" type="p">
              {data.postTime && data.postTime.toLocaleString('ko-KR')}
            </Text>
            {isMine ? (
              data.isPublic ? (
                <SvgIcon name="Public" size={20}></SvgIcon>
              ) : (
                <SvgIcon name="Private" size={20}></SvgIcon>
              )
            ) : undefined}
            {isMine ? (
              <div className="flex flex-row">
                <div className="ml-3">
                  <Button
                    onClick={() =>
                      window.location.replace(
                        `/user-page/${data.nickname}/edit-note/${paramNoteId}`
                      )
                    }
                    color="blue"
                    label="수정"
                    size="text-xs"
                  ></Button>
                </div>
                <div className="ml-3">
                  <Button
                    color="red"
                    onClick={() =>
                      deleteNote(parseInt(paramNoteId), data.nickname)
                    }
                    label="삭제"
                    size="text-xs"
                  ></Button>
                </div>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </div>
        <div className="flex flex-row mx-16">
          <div className="absolute">
            <BookmarkQuoteInfo
              theme={theme}
              bookmarked={data.bookmarkCount}
              quoted={quotationInfo.quotationList.length}
            ></BookmarkQuoteInfo>
          </div>

          <div data-color-mode={theme} className="w-full mx-24">
            <div className="wmde-markdown-var">
              <MarkdownPreview source={data.content} />
            </div>
          </div>
        </div>
        <div className="mx-40 mt-10 mb-4">
          <QuotationListBox
            theme={theme}
            quotationList={quotationInfo.quotationList}
          ></QuotationListBox>
        </div>
      </div>
    )
  );
}
