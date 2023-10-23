package com.ziglog.ziglog.note.entity;

import jakarta.persistence.*;

@Entity
public class Quotation {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "FROM_NOTE_ID")
    private Note fromNote;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TO_NOTE_ID")
    private Note toNote;

}
