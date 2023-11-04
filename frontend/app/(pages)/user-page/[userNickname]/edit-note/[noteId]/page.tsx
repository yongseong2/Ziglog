'use client';
import { redirect, useParams } from 'next/navigation';
import PublicPrivateToggle from '@components/userPage/PublicPrivateToggle';
import Button from '@components/common/Button';
import { useEffect, useRef, useState } from 'react';
import NoteTitleInput from '@components/userPage/NoteTitleInput';
import QuotationModal from '@components/userPage/QuotationModal';
import { getNoteInfo } from '@api/note/note';
import {
  sendEditNoteInfoRequest,
  changeNotePublicStatusRequest,
} from '@api/note/editNote';
import { EditNoteParams } from '@api/note/types';
import { diffChars } from 'diff';
import dynamic from 'next/dynamic';
import { useAppSelector } from '@store/store';
import * as commands from '@uiw/react-md-editor/lib/commands';
import { getBookmark } from '@api/bookmark/bookmark';
import { Note } from '@api/bookmark/types';
import SvgIcon from '@components/common/SvgIcon';
import { BookMark } from '@src/design/iconIndex';
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
});

const {} = commands;

export interface NoteDetail extends EditNoteParams {
  isPublic: boolean;
}

export default function EditNote() {
  const titleRef = useRef<HTMLInputElement>(null);
  const { theme, isLogin } = useAppSelector((state) => state.user);
  const params = useParams();
  const noteId = decodeURIComponent(params.noteId as string);
  const nickname = decodeURIComponent(params.userNickname as string);
  const [oldContent, setOldContent] = useState({ title: '', content: '' });
  const [title, setTitle] = useState('글제목');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [quotingList, setQuotingList] = useState<number[]>([]);
  const [bookmarks, setBookmarks] = useState<Note[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [quotingNoteInfo, setQuotingNoteInfo] = useState({
    nickname: '',
    title: '',
    noteId: 0,
  });

  // 노트 정보 불러오기 + 북마크 정보 가져오기
  useEffect(() => {
    const getNoteInfoEditPage = async (noteId: number) => {
      const result = await getNoteInfo(noteId, isLogin);
      if (result.statusCode === 200) {
        setHasAccess(true);
        setOldContent({
          ...oldContent,
          title: result.data.title,
          content: result.data.content,
        });
        setTitle(result.data.title);
        setContent(result.data.content);
        setIsPublic(result.data.isPublic);
      } else {
        alert(`${result.message}`);
        window.location.replace(`/user-page/${nickname}`);
      }
    };
    const getBookmarkList = async () => {
      const result = await getBookmark();
      if (result) {
        setBookmarks(result.notes);
      }
    };
    getNoteInfoEditPage(parseInt(noteId));
    getBookmarkList();
  }, []);
  // 공개/비공개 여부 수정하기
  const handlePublicPrivateButton = () => {
    const changePublicStatus = async (noteId: number, isPublic: boolean) => {
      const body = { isPublic: !isPublic };
      const result = await changeNotePublicStatusRequest(noteId, body);
      if (result) {
        setIsPublic(!isPublic);
        alert('공개/비공개 설정이 수정되었습니다.');
      }
    };
    changePublicStatus(parseInt(noteId), isPublic);
  };
  // 노트 수정하기
  const handleNoteEdit = () => {
    if (
      (oldContent.content &&
        diffChars(oldContent.content, content).length !== 1) ||
      (oldContent.title && diffChars(oldContent.title, title).length !== 1) ||
      (!oldContent.content && content) ||
      (!oldContent.title && title)
    ) {
      // 참조 목록 업데이트 하기
      const regex = /\[\[(.*?)\]\]/g;
      const matches = content.match(regex);
      const extractedQuotingNotes: string[] = [];
      if (matches) {
        matches.forEach((match) => {
          const extractedContent = match.slice(2, -2); // Remove the double square brackets
          extractedQuotingNotes.push(extractedContent);
        });
      }
      const splitQuotingNotes = extractedQuotingNotes.map((content) => {
        const parts = content.split(':');
        return {
          nickname: parts[0].trim(),
          title: parts[1].trim(),
        };
      });
      const updatedQuotingList: number[] = [];
      splitQuotingNotes.forEach((splitNote) => {
        const matchingBookmark = bookmarks.find(
          (bookmark) =>
            bookmark.nickname === splitNote.nickname &&
            bookmark.title === splitNote.title
        );
        if (matchingBookmark) {
          if (!updatedQuotingList.includes(matchingBookmark.noteId)) {
            updatedQuotingList.push(matchingBookmark.noteId);
          }
        }
      });
      const body = {
        title: title,
        content: content,
        quotingNotes: updatedQuotingList,
      };
      const editNote = async (body: EditNoteParams) => {
        const result = await sendEditNoteInfoRequest(parseInt(noteId), body);
        if (result) {
          alert('정보 수정이 성공적으로 일어났습니다.');
          window.location.replace(
            `/user-page/${params.userNickname}/read-note/${params.noteId}`
          );
        }
      };
      editNote(body);
    } else {
      alert('수정사항이 없습니다');
    }
  };

  return (
    hasAccess && (
      <div>
        <div className="flex flex-row justify-between items-center mb-3">
          <NoteTitleInput
            ref={titleRef}
            theme={theme}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex flex-row items-center gap-3">
            <PublicPrivateToggle
              onClick={() => handlePublicPrivateButton()}
              scope={isPublic ? 'Public' : 'Private'}
              theme={theme}
            />
            <Button
              label={isPublic ? '게시하기' : '저장하기'}
              color="charcol"
              onClick={() => handleNoteEdit()}
            />
          </div>
        </div>
        <MDEditor
          className="relative"
          data-color-mode={theme}
          height={600}
          value={content}
          onChange={(v) => setContent(v || '')}
          preview={'live'}
          hideToolbar={false}
          commands={[
            ...commands.getCommands(),
            commands.divider,
            commands.group([], {
              name: 'update',
              groupName: 'update',
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="12"
                  viewBox="0 -960 960 960"
                  width="12"
                >
                  <path
                    fill="currentColor"
                    d="M273.717-50q-52.442 0-90.08-37.088Q146-124.175 146-178v-604q0-53.825 37.799-90.912Q221.599-910 274.04-910h412.243q52.442 0 90.079 37.088Q814-835.825 814-782v604q0 53.825-37.799 90.912Q738.401-50 685.96-50H273.717ZM274-178h412v-604h-54v312l-96-48-96 48v-312H274v604Zm0 0v-604 604Zm166-292 96-48 96 48-96-48-96 48Z"
                  />
                </svg>
              ),
              children: ({ execute }) => {
                useEffect(() => {
                  execute();
                }, [quotingNoteInfo]);
                return (
                  <div>
                    <QuotationModal
                      bookmarks={bookmarks}
                      setQuotingNoteInfo={setQuotingNoteInfo}
                    />
                  </div>
                );
              },
              execute: (
                state: commands.ExecuteState,
                api: commands.TextAreaTextApi
              ) => {
                console.log('>>>>>>update>>>>>', state);
                let modifyText = `[[${state.selectedText}]]`;
                if (!state.selectedText) {
                  modifyText = `[[${quotingNoteInfo.nickname} : ${quotingNoteInfo.title}]] `;
                }
                api.replaceSelection(modifyText);
              },
              buttonProps: { 'aria-label': 'See Bookmark List' },
            }),
          ]}
        ></MDEditor>
      </div>
    )
  );
}
