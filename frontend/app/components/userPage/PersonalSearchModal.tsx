import Text from '@components/common/Text';
import { HTMLAttributes } from 'react';
import PersonalSearchResult from './Search/PersonalSearchResult';
import Link from 'next/link';

interface SearchResult {
  noteId: number;
  title: string;
  preview: string;
  postTime: Date;
  bookmarkCount: number;
}

interface PersonalSearchModalProps extends HTMLAttributes<HTMLDivElement> {
  theme: 'light' | 'dark';
  SearchResults?: SearchResult[];
  nickname?: string;
  keyword?: string;
}

export default function PersonalSearchModal({
  theme,
  SearchResults,
  nickname,
  keyword,
}: PersonalSearchModalProps) {
  return (
    <div
      className={`${THEME_VARIANTS[theme]} w-132 shadow-md border text-center rounded-md justify-center px-3`}
    >
      <div id="sidebar-scroll" className="h-screen overflow-y-auto my-3">
        {SearchResults?.map((searchResult, index) => (
          <div key={index} className="mb-3">
            <Link
              key={index}
              href={{
                pathname: `/user-page/${nickname}/read-note/${searchResult.noteId}`,
                query: { keyword: keyword },
              }}
            >
              <PersonalSearchResult
                key={index}
                theme={theme}
                title={searchResult.title}
                preview={searchResult.preview}
                postTime={searchResult.postTime}
                bookmarkCount={searchResult.bookmarkCount}
              ></PersonalSearchResult>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

const THEME_VARIANTS = {
  light: 'bg-white',
  dark: 'bg-dark-background-page text-white',
};
