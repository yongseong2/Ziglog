package com.ziglog.ziglog.domain.note.repository;

import com.ziglog.ziglog.domain.note.entity.Note;
import com.ziglog.ziglog.domain.note.entity.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuotationRepository extends JpaRepository<Quotation, Long> {

    void deleteQuotationById(Long id) throws Exception;
    Quotation findByStartNoteAndEndNote (Note startNote, Note endNote);
    void deleteQuotationsByIdIn(List<Long> noteId);
}
