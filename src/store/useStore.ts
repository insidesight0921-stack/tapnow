import { create } from 'zustand';

// 데이터 모델 타입 정의
export interface Plan {
  id: string;
  name: string;
  price: number;
  months: number;
  type: '횟수권' | '기간권';
  defaultQty?: number;
}

export interface PlanItem {
  id?: string;
  name: string;
  qty: number;
  remainingQty?: number; // 잔여 횟수 (횟수권 전용)
  type?: '횟수권' | '기간권';
}

export interface Member {
  id: string;
  gymId: string;
  name: string;
  phone: string;
  belt: string;
  gral: number;
  registerDate: string;
  startDate: string;
  plans: PlanItem[];
  paymentAmount: number;
  paymentMethod: string;
  expireDate: string;
  memo: string;
}

export interface Attendance {
  id: string;
  memberId: string;
  memberName: string;
  date: string; // YYYY-MM-DD 형식
}

// 도장 구독 정보 (소유자 전용)
export interface GymAccount {
  id: string;
  gymName: string;
  ownerEmail: string;
  ownerPassword?: string; // 추가: 로그인 검증용
  registeredAt: string; // YYYY-MM-DD
  memberCount: number;
  plan: 'free' | 'basic' | 'plus';
  planExpireDate: string; // YYYY-MM-DD
  status: 'active' | 'suspended' | 'trial';
  memo: string;
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  method: '카드' | '현금' | '계좌이체' | '기타';
  planName: string;
  date: string; // YYYY-MM-DD
  status: '완료' | '미납';
}

interface AppState {
  members: Member[];
  plans: Plan[];
  attendances: Attendance[];
  payments: Payment[];

  gymAccounts: GymAccount[];

  // Auth & Multi-tenant state
  isAuthenticated: boolean;
  userRole: 'SUPER_ADMIN' | 'GYM_ADMIN' | null;
  gymId: string | null;
  gymName: string;
  adminEmail: string | null;
  adminPassword: string;
  gymPin: string; // 키오스크 4자리 PIN
  theme: 'dark' | 'light';
  profileImage: string | null;

  // Super Admin 전용 액션 (도장 계정 관리)
  addGymAccount: (gym: Omit<GymAccount, 'id'>) => void;
  updateGymAccount: (id: string, fields: Partial<GymAccount>) => void;
  deleteGymAccount: (id: string) => void;

  // Actions
  loginAs: (role: 'SUPER_ADMIN' | 'GYM_ADMIN', gymId: string, email: string, gymName: string, password?: string) => void;
  logout: () => void;
  updateEmail: (email: string) => void;
  updatePassword: (password: string) => void;
  updatePin: (pin: string) => void;
  deleteAccount: () => void;

  // Member Actions
  addMember: (member: Omit<Member, 'id'>) => { success: boolean; message: string };
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  
  // Gym Signup
  signupGym: (gymName: string, email: string, password: string) => void;

  // Settings Actions
  updateSettings: (theme: 'dark' | 'light', profileImage: string | null) => void;

  // Plan Actions
  addPlan: (plan: Omit<Plan, 'id'>) => void;
  updatePlan: (id: string, plan: Partial<Plan>) => void;
  deletePlan: (id: string) => void;

  // Attendance Actions
  markAttendance: (memberId: string) => void;
  bulkMarkAttendance: (memberIds: string[]) => void;
  deleteAttendance: (attendanceId: string) => void;
  addPastAttendance: (memberId: string, dateStr: string) => void;

  // Payment Actions
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePaymentStatus: (id: string, status: '완료' | '미납') => void;

  // UI State
  editingMember: Member | null;
  isMemberModalOpen: boolean;
  openMemberModal: (member?: Member) => void;
  closeMemberModal: () => void;

  isPlanModalOpen: boolean;
  openPlanModal: () => void;
  closePlanModal: () => void;

  isCsvModalOpen: boolean;
  openCsvModal: () => void;
  closeCsvModal: () => void;
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayStr = () => new Date().toISOString().split('T')[0];

export const useStore = create<AppState>((set) => ({
  members: [
    {
      id: 'm1', gymId: 'gym_01', name: '홍길동', phone: '010-1234-5678', belt: '블루', gral: 2,
      registerDate: '2026-01-01', startDate: '2026-01-01',
      plans: [{ name: '주 3회권', qty: 1, remainingQty: 8, type: '횟수권' }],
      paymentAmount: 150000, paymentMethod: '카드 결제', expireDate: '2026-04-30', memo: ''
    },
    {
      id: 'm2', gymId: 'gym_01', name: '김철수', phone: '010-9999-1111', belt: '화이트', gral: 0,
      registerDate: '2026-02-01', startDate: '2026-02-01',
      plans: [{ name: '1개월 무제한', qty: 1, type: '기간권' }],
      paymentAmount: 180000, paymentMethod: '현금', expireDate: '2026-03-01', memo: '도복 포함'
    }
  ],
  plans: [
    { id: 'p1', name: '주 2회권', price: 140000, months: 1, type: '횟수권', defaultQty: 8 },
    { id: 'p2', name: '주 3회권', price: 150000, months: 1, type: '횟수권', defaultQty: 12 },
    { id: 'p3', name: '1개월 무제한', price: 180000, months: 1, type: '기간권' },
    { id: 'p4', name: '3개월 무제한', price: 450000, months: 3, type: '기간권' },
  ],
  attendances: [],
  payments: [
    { id: 'pay1', memberId: 'm1', memberName: '홍길동', amount: 150000, method: '카드', planName: '주 3회권', date: '2026-01-01', status: '완료' },
    { id: 'pay2', memberId: 'm2', memberName: '김철수', amount: 180000, method: '현금', planName: '1개월 무제한', date: '2026-02-01', status: '완료' },
  ],

  // 등록된 도장 계정 (소유자 전용 관리)
  gymAccounts: [
    {
      id: 'gym_01', gymName: '오닉스 주짓수 본관', ownerEmail: 'gym@tapnow.com', ownerPassword: '1234',
      registeredAt: '2026-01-15', memberCount: 45, plan: 'basic', planExpireDate: '2026-07-15',
      status: 'active', memo: ''
    },
    {
      id: 'gym_02', gymName: '타이거 주짓수', ownerEmail: 'tiger@tapnow.com', ownerPassword: 'abc1234',
      registeredAt: '2026-02-20', memberCount: 28, plan: 'free', planExpireDate: '2026-08-20',
      status: 'active', memo: '신규 가맹점'
    },
    {
      id: 'gym_03', gymName: '주짓수랩 강남', ownerEmail: 'lab@tapnow.com',
      registeredAt: '2026-03-01', memberCount: 82, plan: 'plus', planExpireDate: '2026-09-01',
      status: 'active', memo: '카카오톡 연동 도장'
    }
  ],

  // UI State 초기값
  editingMember: null,
  isMemberModalOpen: false,
  openMemberModal: (member) => set({ isMemberModalOpen: true, editingMember: member || null }),
  closeMemberModal: () => set({ isMemberModalOpen: false, editingMember: null }),

  isPlanModalOpen: false,
  openPlanModal: () => set({ isPlanModalOpen: true }),
  closePlanModal: () => set({ isPlanModalOpen: false }),

  isCsvModalOpen: false,
  openCsvModal: () => set({ isCsvModalOpen: true }),
  closeCsvModal: () => set({ isCsvModalOpen: false }),

  // Owner 전용 도장 CRUD
  addGymAccount: (gym) => set((state) => ({
    gymAccounts: [...state.gymAccounts, { ...gym, id: `gym_${Date.now()}` }]
  })),
  updateGymAccount: (id, fields) => set((state) => ({
    gymAccounts: state.gymAccounts.map(g => g.id === id ? { ...g, ...fields } : g)
  })),
  deleteGymAccount: (id) => set((state) => ({
    gymAccounts: state.gymAccounts.filter(g => g.id !== id)
  })),

  // Auth 초기 상태
  isAuthenticated: false,
  userRole: null,
  gymId: null,
  gymName: '',
  adminEmail: null,
  adminPassword: '',
  gymPin: '0000', // 기본 키오스크 PIN
  theme: 'dark',
  profileImage: null,

  updateSettings: (theme: 'dark' | 'light', profileImage: string | null) => set({ theme, profileImage }),
  updateEmail: (email: string) => set({ adminEmail: email }),
  updatePassword: (password: string) => set({ adminPassword: password }),
  updatePin: (pin: string) => set({ gymPin: pin }),
  deleteAccount: () => set({
    isAuthenticated: false, userRole: null, gymId: null, gymName: '', adminEmail: null, adminPassword: ''
  }),

  loginAs: (role: 'SUPER_ADMIN' | 'GYM_ADMIN', gymId: string, email: string, gymName: string, password = '') => set({
    isAuthenticated: true,
    userRole: role,
    gymId,
    adminEmail: email,
    adminPassword: password,
    gymName
  }),
  logout: () => set({
    isAuthenticated: false,
    userRole: null,
    gymId: null,
    gymName: '',
    adminEmail: null
  }),

  addMember: (member) => {
    const state = useStore.getState();
    const currentGym = state.gymAccounts.find(g => g.id === member.gymId);
    
    if (currentGym && currentGym.plan === 'free') {
      const currentCount = state.members.filter(m => m.gymId === member.gymId).length;
      if (currentCount >= 35) {
        return { success: false, message: '무료 요금제 한도(35명)를 초과했습니다. 베이직 이상 요금제로 업그레이드가 필요합니다.' };
      }
    }

    set((state) => ({
      members: [...state.members, { ...member, id: `m${Date.now()}` }]
    }));
    return { success: true, message: '회원이 등록되었습니다.' };
  },
  updateMember: (id, updatedFields) => set((state) => ({
    members: state.members.map(m => m.id === id ? { ...m, ...updatedFields } : m)
  })),
  deleteMember: (id) => set((state) => ({
    members: state.members.filter(m => m.id !== id),
    attendances: state.attendances.filter(a => a.memberId !== id)
  })),

  addPlan: (plan) => set((state) => ({
    plans: [...state.plans, { ...plan, id: `p${Date.now()}` }]
  })),
  updatePlan: (id, updatedFields) => set((state) => ({
    plans: state.plans.map(p => p.id === id ? { ...p, ...updatedFields } : p)
  })),
  deletePlan: (id) => set((state) => ({
    plans: state.plans.filter(p => p.id !== id)
  })),

  // 출석 날짜만 저장 (YYYY-MM-DD), 중복 방지, 횟수권 차감
  markAttendance: (memberId) => set((state) => {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return state;

    const todayStr = getTodayStr();
    // 오늘 이미 출석했으면 추가 안 함
    if (state.attendances.some(a => a.memberId === memberId && a.date === todayStr)) {
      return state;
    }

    const newAttendance: Attendance = {
      id: `a${Date.now()}_${Math.random()}`,
      memberId,
      memberName: member.name,
      date: todayStr
    };

    // 횟수권 회원의 잔여 횟수 차감
    const updatedMembers = state.members.map(m => {
      if (m.id !== memberId) return m;
      const updatedPlans = m.plans.map(p => {
        if (p.type === '횟수권' && p.remainingQty !== undefined && p.remainingQty > 0) {
          return { ...p, remainingQty: p.remainingQty - 1 };
        }
        return p;
      });
      return { ...m, plans: updatedPlans };
    });

    return {
      attendances: [...state.attendances, newAttendance],
      members: updatedMembers
    };
  }),

  bulkMarkAttendance: (memberIds) => set((state) => {
    const todayStr = getTodayStr();
    const newAttendances: Attendance[] = [];
    let updatedMembers = [...state.members];

    memberIds.forEach(memberId => {
      if (state.attendances.some(a => a.memberId === memberId && a.date === todayStr)) return;
      const member = state.members.find(m => m.id === memberId);
      if (!member) return;
      newAttendances.push({
        id: `a${Date.now()}_${Math.random()}`,
        memberId,
        memberName: member.name,
        date: todayStr
      });
      updatedMembers = updatedMembers.map(m => {
        if (m.id !== memberId) return m;
        const updatedPlans = m.plans.map(p => {
          if (p.type === '횟수권' && p.remainingQty !== undefined && p.remainingQty > 0) {
            return { ...p, remainingQty: p.remainingQty - 1 };
          }
          return p;
        });
        return { ...m, plans: updatedPlans };
      });
    });

    return { attendances: [...state.attendances, ...newAttendances], members: updatedMembers };
  }),

  deleteAttendance: (attendanceId) => set((state) => ({
    attendances: state.attendances.filter(a => a.id !== attendanceId)
  })),

  addPastAttendance: (memberId, dateStr) => set((state) => {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return state;
    // 날짜만 추출 (YYYY-MM-DD)
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const newAttendance: Attendance = {
      id: `a${Date.now()}_${Math.random()}`,
      memberId,
      memberName: member.name,
      date: dateOnly
    };
    return { attendances: [...state.attendances, newAttendance] };
  }),

  addPayment: (payment) => set((state) => ({
    payments: [...state.payments, { ...payment, id: `pay${Date.now()}` }]
  })),
  updatePaymentStatus: (id, status) => set((state) => ({
    payments: state.payments.map(p => p.id === id ? { ...p, status } : p)
  })),

  // Sign Up Action
  signupGym: (gymName, email, password) => set((state) => {
    const newGymId = `gym_${Date.now()}`;
    const newGym: GymAccount = {
      id: newGymId,
      gymName,
      ownerEmail: email,
      ownerPassword: password,
      registeredAt: getTodayStr(),
      memberCount: 0,
      plan: 'free',
      planExpireDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0],
      status: 'active',
      memo: '직접 가맹'
    };
    return {
      gymAccounts: [...state.gymAccounts, newGym]
    };
  }),
}));
