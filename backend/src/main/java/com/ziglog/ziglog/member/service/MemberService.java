package com.ziglog.ziglog.member.service;

import com.ziglog.ziglog.member.entity.Member;

import java.util.Optional;

public interface MemberService {

    Optional<Member> findUserByEmail(String email);
    Optional<Member> findUserByNickname(String nickname);

    void modifyUserNickname(String nickname);
    boolean checkNicknameDuplication(String nickname);

    void signUp(String email, String nickname);
}
