package com.ziglog.ziglog.global.auth.service;

import com.ziglog.ziglog.domain.member.entity.Member;
import com.ziglog.ziglog.domain.member.entity.Role;
import com.ziglog.ziglog.domain.member.repository.MemberRepository;
import com.ziglog.ziglog.global.auth.dto.RegistrationId;
import com.ziglog.ziglog.global.auth.dto.OAuth2Attributes;
import com.ziglog.ziglog.global.auth.entity.CustomOAuth2User;
import com.ziglog.ziglog.global.auth.util.NicknameGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@RequiredArgsConstructor
@Service
@Slf4j
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("OAuth2UserService - loadUser()");

        OAuth2UserService<OAuth2UserRequest, OAuth2User> defaultOAuth2UserService = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = defaultOAuth2UserService.loadUser(userRequest);

        RegistrationId registrationId = RegistrationId.valueOf(userRequest.getClientRegistration().getRegistrationId());

        String nameAttributeName = userRequest.getClientRegistration().getProviderDetails()
                .getUserInfoEndpoint().getUserNameAttributeName();

        Map<String, Object> attributes = oAuth2User.getAttributes();

        OAuth2Attributes oAuth2Attributes = OAuth2Attributes.of(registrationId, nameAttributeName, attributes);

        Member member = getMember(oAuth2Attributes);

        return new CustomOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(member.getRole().name())),
                attributes,
                oAuth2Attributes.getNameAttributeKey(),
                member
        );
    }

    private Member getMember(OAuth2Attributes oAuth2Attributes){
        log.info("OAuth2UserService - getMember()");
        Member member = oAuth2Attributes.toEntity();

        //첫 로그인인 경우 임의의 닉네임을 배정해서 저장
        return memberRepository.findMemberByEmail(member.getEmail()).orElse(saveMember(member));
    }

    private Member saveMember(Member member) {
        log.info("OAuth2UserService - saveMember()");

        //아직 없는 닉네임이 나올 때까지 새로운 닉네임을 만듦
        String tempNick = NicknameGenerator.generateRandomNickname();
        log.info("OAuth2UserService - saveMember() : 새로운 닉네임을 배정. {}", tempNick);
        while (memberRepository.existsMemberByNickname(tempNick)){
            tempNick = NicknameGenerator.generateRandomNickname();
            log.info("OAuth2UserService - saveMember() : 새로운 닉네임을 배정. {}", tempNick);
        }

        //임의의 닉네임 + 임의의 비밀번호를 배정하고 저장
        return memberRepository.save(
            Member.builder()
                    .email(member.getEmail())//받아온 이메일
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))//임의의 비밀번호
                    .nickname(tempNick)//임의의 닉네임
                    .profileUrl(member.getProfileUrl())//받아온 프로필 경로
                    .role(Role.USER)//회원으로 권한 설정
                    .build()
        );
    }
}
