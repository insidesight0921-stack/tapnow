/**
 * 카카오 알림톡 서비스 (Solapi 등 외부 서비스 연동용)
 * 현재는 콘솔 로그로 대체하며, 실 서비스 전환 시 API 연동이 필요합니다.
 */

interface AlimtalkOptions {
  to: string;       // 수신번호
  templateId: string; // 템플릿 ID
  params: Record<string, string>; // 치환 문구
}

export const alimtalkService = {
  /**
   * 알림톡 전송
   */
  send: async (options: AlimtalkOptions) => {
    console.log(`[알림톡 발송 예약] 수신: ${options.to}, 템플릿: ${options.templateId}`);
    console.log('치환 문구:', options.params);
    
    // TODO: 실제 알림톡 서비스(Solapi 등) API 호출 로직 추가
    return { success: true, messageId: `msg_${Math.random().toString(36).substring(7)}` };
  },

  /**
   * 출석 알림 발송 예시
   */
  sendAttendanceNotice: async (phone: string, name: string, time: string) => {
    return alimtalkService.send({
      to: phone,
      templateId: 'ATTENDANCE_CONFIRM',
      params: {
        '#{이름}': name,
        '#{시간}': time
      }
    });
  }
};
