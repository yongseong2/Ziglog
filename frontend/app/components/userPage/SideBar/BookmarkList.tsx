'use client';
import { Note } from '@api/bookmark/types';
import IconButton from '@components/common/IconButton';
import SvgIcon from '@components/common/SvgIcon';
import Text from '@components/common/Text';
import colors from '@src/design/color';
import { showAlert } from '@src/util/alert';
import Link from 'next/link';
import { useState, useContext } from 'react';
import Swal from 'sweetalert2';
import { deleteBookmark } from '@api/bookmark/bookmark';
import SideDataContext from '@(pages)/user-page/[userNickname]/SideDataContext';
import { useRouter } from 'next/navigation';

export interface BookmarkListProps {
  noteList: Note[];
  theme?: 'light' | 'dark';
}

const THEME_VARIANTS = {
  light: '#F6F6F6',
  dark: '#3A3A3C',
};

export default function BookmarkList({
  noteList,
  theme = 'light',
}: BookmarkListProps) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const displayedNotes = showAll ? noteList : noteList.slice(0, 5);
  const { getBookmarkList } = useContext(SideDataContext);
  const handleUndoBookmark = (noteId: number, theme: 'light' | 'dark') => {
    const bg = THEME_VARIANTS[theme];
    const textColor = theme === 'light' ? 'black' : 'white';
    Swal.fire({
      html: '해당 노트에 대한 북마크를<br>해제하시겠습니까?',
      showCloseButton: true,
      width: 300,
      background: bg,
      color: textColor,
      confirmButtonText: '해제하기',
      confirmButtonColor: '#3D4EFE',
    }).then(async (res) => {
      if (res.isConfirmed) {
        const res = deleteBookmark(noteId);
        if (await res) {
          showAlert('성공적으로 해제되었습니다', 'success');
          getBookmarkList();
        }
      }
    });
  };
  return (
    <div className="w-full">
      <div className="flex justify-between">
        <div className="flex items-center ">
          <SvgIcon
            name="BookMarks"
            color={theme === 'light' ? colors.black : colors.white}
          />
          <Text type="b" className={`pl-1 truncate ${THEME_VARINTS[theme]}`}>
            북마크
          </Text>
        </div>
        {noteList.length > 5 && !showAll && (
          <IconButton
            theme={theme}
            onClick={() => setShowAll(true)}
            name="ExpandMore"
          />
        )}
        {showAll && (
          <IconButton
            theme={theme}
            onClick={() => setShowAll(false)}
            name="ExpandLess"
          />
        )}
      </div>
      <div className="mt-5">
        {displayedNotes.map((note) => {
          return (
            <div
              key={note.noteId}
              className="flex items-center mb-3 opacity-100 "
            >
              <span className=" cursor-pointer hover:opacity-60 transition-opacity duration-300">
                <SvgIcon
                  onClick={() => handleUndoBookmark(note.noteId, theme)}
                  name="BookMarkFill"
                  color={theme === 'light' ? colors.black : colors.white}
                />
              </span>
              <span
                onClick={() =>
                  router.push(
                    `/user-page/${note.nickname}/read-note/${note.noteId}`
                  )
                }
                className={`pl-1 truncate ${THEME_VARINTS[theme]} cursor-pointer hover:opacity-60 transition-opacity duration-300`}
              >
                {note.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const THEME_VARINTS = {
  light: '',
  dark: 'text-white',
};
