package com.ziglog.ziglog.domain.bookmark.service;

import com.ziglog.ziglog.domain.bookmark.entity.Bookmark;
import com.ziglog.ziglog.domain.bookmark.exception.exceptions.BookmarkAlreadyExistsException;
import com.ziglog.ziglog.domain.bookmark.exception.exceptions.BookmarkNotFoundException;
import com.ziglog.ziglog.domain.bookmark.repository.BookmarkRepository;
import com.ziglog.ziglog.domain.member.entity.Member;
import com.ziglog.ziglog.domain.member.exception.exceptions.UserNotFoundException;
import com.ziglog.ziglog.domain.member.repository.MemberRepository;
import com.ziglog.ziglog.domain.note.entity.Note;
import com.ziglog.ziglog.domain.note.exception.exceptions.NoteNotFoundException;
import com.ziglog.ziglog.domain.note.repository.NoteRepository;
import com.ziglog.ziglog.domain.notification.entity.Notification;
import com.ziglog.ziglog.domain.notification.service.EmitterService;
import com.ziglog.ziglog.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookmarkServiceImpl implements BookmarkService {

    private final MemberRepository memberRepository;
    private final NoteRepository noteRepository;
    private final BookmarkRepository bookmarkRepository;
    //TODO 결합도 높아지는 거 같긴 한데 좀 더 나은 설계를 생각해봐야 함
    private final NotificationService notificationService;
    private final EmitterService emitterService;

    @Override
    public void addBookmark(Member member, Long noteId) throws UserNotFoundException, NoteNotFoundException,BookmarkAlreadyExistsException {
        Note note = noteRepository.findNoteById(noteId).orElseThrow(NoteNotFoundException::new);
        Member memberPersist = memberRepository.findByEmail(member.getEmail()).orElseThrow(UserNotFoundException::new);

        List<Bookmark> bookmarkList = bookmarkRepository.findAllByMember(memberPersist);
        Bookmark checkExists = bookmarkList.stream().filter(bookmark -> bookmark.getNote().getId().equals(noteId)).findAny().orElse(null);
        if (checkExists != null) throw new BookmarkAlreadyExistsException();

        Bookmark bookmark = Bookmark.builder()
                            .member(memberPersist)
                            .note(note)
                            .build();

        bookmark = bookmarkRepository.save(bookmark);
        memberPersist.getBookmarks().add(bookmark);

        Notification notification = notificationService.saveBookmarkNotification(note.getAuthor(), bookmark);

        try {
            emitterService.notifyEvent(note.getAuthor(), notification);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void deleteBookmark(Member member, Long noteId) throws NoteNotFoundException, UserNotFoundException, BookmarkNotFoundException{
        //persist
        Note note = noteRepository.findNoteById(noteId).orElseThrow(NoteNotFoundException::new);
        Member memberPersist = memberRepository.findByEmail(member.getEmail()).orElseThrow(UserNotFoundException::new);
        Bookmark bookmark = bookmarkRepository.findBookmarkByMemberAndNote(memberPersist, note).orElseThrow(BookmarkNotFoundException::new);

        memberPersist.getBookmarks().remove(bookmark);
        bookmarkRepository.delete(bookmark);
    }

    @Override
    public List<Bookmark> getBookmarks(Member member) throws UserNotFoundException {
        Member memberPersist = memberRepository.findByEmail(member.getEmail()).orElseThrow(UserNotFoundException::new);
        return memberPersist.getBookmarks();
    }

    @Override
    public Boolean checkIsBookmarked(Member member, Long noteId) throws UserNotFoundException {
        Member memberPersist = memberRepository.findByEmail(member.getEmail()).orElseThrow(UserNotFoundException::new);
        List<Bookmark> bookmarks = memberPersist.getBookmarks();

        for (Bookmark bookmark : bookmarks) {
            if (bookmark.getNote().getId().equals(noteId)) {
                return true;
            }
        }
        return false;
    }
}
