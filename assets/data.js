/* =========================================================
   그랑쉐프몰 — 상품 카탈로그 데이터 (1차 시안)
   ※ 모든 금액은 실제 판매가가 아닌 "시안 예시가"입니다.
      price: null 인 옵션은 "회원/견적 협의" 품목입니다.
   ========================================================= */
window.GC_DATA = {
  notice:
    '1차 시안입니다. 표시된 금액은 실제 판매가가 아닌 시안 예시가이며, 결제(PG)는 아직 연동되지 않아 실제 청구가 이루어지지 않습니다.',

  company: {
    name: '(주)그랑쉐프',
    nameEn: 'GRANDCHEF CO., LTD.',
    ceo: '정희숙',
    bizNo: '605-81-47231',
    addr: '부산광역시 강서구 평강로345번길 45 (대저1동)',
    zip: '46700',
    tel: '051-892-8930',
    fax: '051-892-8937',
    emails: ['grandchef@naver.com', 'grandcook.com@gmail.com'],
    hours: '평일 08:30 – 17:30 (주말·공휴일 휴무)',
    site: 'https://grandchef.co.kr'
  },

  /* 배송 정책 (시안 기준) */
  shipping: {
    freeOver: 50000,
    direct: { label: '부울경 직배송', fee: 4000, note: '부산·울산·경남 지역 화물 직배송 · 5만원 이상 무료' },
    parcel: { label: '택배 배송', fee: 3500, note: '전국 택배 · 5만원 이상 무료 (제주·도서산간 별도)' }
  },

  categories: [
    { id: 'all', name: '전체 상품', short: '전체' },
    { id: 'biz', name: '업소·식당용', short: '업소·식당용' },
    { id: 'home', name: '가정·선물용', short: '가정·선물용' }
  ],

  products: [
    {
      id: 'biz-wok-large',
      name: '업소용 대형 스테인리스 볶음솥',
      cat: 'biz',
      sub: '볶음솥·전판',
      spec: '스테인리스 304 · 인덕션 겸용 · 업소용',
      img: 'assets/products/pro-01-wok-griddle.jpg',
      tags: '볶음솥 웍 스텐 업소 식당 급식 주방 대형 솥',
      price: 89000,
      unit: '개',
      options: [
        { label: '40cm', price: 89000 },
        { label: '50cm', price: 119000 },
        { label: '60cm (대형)', price: null }
      ],
      desc:
        '식당·급식소 주방에서 가장 많이 쓰는 대형 볶음솥입니다. 두꺼운 스테인리스 3중 바닥으로 열이 고르게 퍼지고, 인덕션·가스레인지 모두에서 사용할 수 있습니다. 손잡이는 리벳 고정으로 오래 써도 흔들리지 않습니다.',
      specs: [
        ['재질', '스테인리스 304 (3중 바닥)'],
        ['규격', '40 · 50 · 60cm'],
        ['사용 열원', '인덕션 · 가스 · 하이라이트'],
        ['구성', '볶음솥 1개 (뚜껑 별매)']
      ]
    },
    {
      id: 'biz-bat-stainless',
      name: '스테인리스 밧드 세트',
      cat: 'biz',
      sub: '밧드·튀김',
      spec: '스텐 밧드(바트) · 6종 / 10종',
      img: 'assets/products/pro-03-bat-fryer.jpg',
      tags: '밧드 바트 스텐 식재료 용기 업소',
      price: 68000,
      unit: '세트',
      options: [
        { label: '6종 세트', price: 68000 },
        { label: '10종 세트', price: 112000 }
      ],
      desc:
        '식재료 손질·보관에 쓰는 스테인리스 밧드 세트입니다. 규격별로 겹쳐 보관할 수 있어 냉장고와 작업대 공간을 아낄 수 있습니다.',
      specs: [
        ['재질', '스테인리스 304'],
        ['구성', '6종(1/1~1/9) · 10종'],
        ['두께', '0.7T'],
        ['특징', '겹침 보관 · 식기세척기 사용 가능']
      ]
    },
    {
      id: 'biz-coated-pan',
      name: '업소용 대형 코팅 프라이팬',
      cat: 'biz',
      sub: '프라이팬·웍',
      spec: '4중 코팅 · 30/35/40cm · 업소용',
      img: 'assets/products/pro-02-coated-pan.jpg',
      tags: '후라이팬 프라이팬 코팅 업소 대형',
      price: 42000,
      unit: '개',
      options: [
        { label: '30cm', price: 42000 },
        { label: '35cm', price: 49000 },
        { label: '40cm', price: 58000 }
      ],
      desc:
        '업소 화력에 견디도록 코팅층을 4중으로 올린 대형 프라이팬입니다. 바닥이 두꺼워 눌어붙음이 적고, 하루 종일 반복 사용하는 주방에 맞춘 두께입니다.',
      specs: [
        ['재질', '알루미늄 + 4중 코팅'],
        ['규격', '30 · 35 · 40cm'],
        ['사용 열원', '가스 · 하이라이트 (인덕션 미지원)'],
        ['구성', '프라이팬 1개']
      ]
    },
    {
      id: 'biz-ttukbaegi',
      name: '업소용 내열 뚝배기',
      cat: 'biz',
      sub: '뚝배기',
      spec: '내열 세라믹 · 1~3호',
      img: 'assets/products/pro-04-ttukbaegi.jpg',
      tags: '뚝배기 내열 찌개 전골 업소',
      price: 12000,
      unit: '개',
      options: [
        { label: '1호 (개인용)', price: 12000 },
        { label: '2호', price: 16000 },
        { label: '3호 (전골용)', price: 21000 }
      ],
      desc:
        '직화에 바로 올릴 수 있는 업소용 내열 뚝배기입니다. 두꺼운 벽체로 보온이 오래가고, 반복 가열에도 갈라짐이 적습니다.',
      specs: [
        ['재질', '내열 세라믹'],
        ['규격', '1 · 2 · 3호'],
        ['사용', '직화 · 전기레인지'],
        ['구성', '뚝배기 1개 (뚜껑 별매)']
      ]
    },
    {
      id: 'biz-griddle',
      name: '업소용 스테인리스 전판 (전골판)',
      cat: 'biz',
      sub: '볶음솥·전판',
      spec: '스테인리스 · 원형 전골판 · 업소용',
      img: 'assets/products/pro-01-wok-griddle.jpg',
      tags: '전판 전골판 철판 업소 스텐 주방',
      price: 96000,
      unit: '개',
      options: [
        { label: '45cm', price: 96000 },
        { label: '60cm', price: null }
      ],
      desc:
        '불판·전골 요리에 쓰는 업소용 원형 전판입니다. 넓은 면적으로 고기와 채소를 한 번에 조리할 수 있고, 테두리가 둥글게 처리되어 기름이 흐르지 않습니다.',
      specs: [
        ['재질', '스테인리스'],
        ['규격', '45 · 60cm'],
        ['두께', '2.5T'],
        ['구성', '전판 1개']
      ]
    },
    {
      id: 'biz-fry-basket',
      name: '튀김 바스켓 4종 세트',
      cat: 'biz',
      sub: '밧드·튀김',
      spec: '스테인리스 채망 · 손잡이형',
      img: 'assets/products/pro-03-bat-fryer.jpg',
      tags: '튀김 바스켓 채반 채망 업소',
      price: 39000,
      unit: '세트',
      options: [{ label: '4종 세트', price: 39000 }],
      desc:
        '튀김기·솥에 걸어 쓰는 스테인리스 바스켓입니다. 굵은 망으로 기름 배출이 빠르고, 손잡이가 길어 화상 위험이 적습니다.',
      specs: [
        ['재질', '스테인리스'],
        ['구성', '4종 (지름 18~28cm)'],
        ['특징', '기름 배출 망 · 손잡이형'],
        ['관리', '식기세척기 사용 가능']
      ]
    },
    {
      id: 'biz-stock-pot',
      name: '업소용 스테인리스 국솥',
      cat: 'biz',
      sub: '볶음솥·전판',
      spec: '20L / 30L · 대용량 국솥',
      img: 'assets/products/cat-01-pot.jpg',
      tags: '국솥 대용량 스텐 업소 급식 솥',
      price: 132000,
      unit: '개',
      options: [
        { label: '20L', price: 132000 },
        { label: '30L', price: 168000 }
      ],
      desc:
        '육수·국을 대량으로 끓이는 업소용 스테인리스 국솥입니다. 바닥이 넓고 두꺼워 장시간 끓여도 눌어붙음이 적습니다.',
      specs: [
        ['재질', '스테인리스 304'],
        ['용량', '20L · 30L'],
        ['사용 열원', '가스 · 인덕션'],
        ['구성', '국솥 1개 (뚜껑 포함)']
      ]
    },
    {
      id: 'biz-coated-wok',
      name: '업소용 코팅 웍',
      cat: 'biz',
      sub: '프라이팬·웍',
      spec: '36/40cm · 업소용 볶음팬',
      img: 'assets/products/pro-02-coated-pan.jpg',
      tags: '웍 볶음팬 코팅 업소 중국집',
      price: 52000,
      unit: '개',
      options: [
        { label: '36cm', price: 52000 },
        { label: '40cm', price: 61000 }
      ],
      desc:
        '중화 요리·볶음 요리에 쓰는 업소용 코팅 웍입니다. 깊이가 있어 재료가 넘치지 않고, 코팅면이 넓어 기름 사용량을 줄일 수 있습니다.',
      specs: [
        ['재질', '알루미늄 + 코팅'],
        ['규격', '36 · 40cm'],
        ['사용 열원', '가스 전용'],
        ['구성', '웍 1개']
      ]
    },
    {
      id: 'biz-strainer',
      name: '업소용 스테인리스 채반 3종',
      cat: 'biz',
      sub: '밧드·튀김',
      spec: '대·중·소 · 손잡이 채반',
      img: 'assets/products/pro-03-bat-fryer.jpg',
      tags: '채반 소쿠리 스텐 업소 손질',
      price: 28000,
      unit: '세트',
      options: [{ label: '3종 세트', price: 28000 }],
      desc:
        '야채·면 손질에 쓰는 스테인리스 채반 세트입니다. 대·중·소 세 가지 크기로 작업대 위에서 바로 물을 뺄 수 있습니다.',
      specs: [
        ['재질', '스테인리스'],
        ['구성', '대 · 중 · 소 3종'],
        ['특징', '양손 손잡이'],
        ['관리', '식기세척기 사용 가능']
      ]
    },
    {
      id: 'biz-bat-pc',
      name: 'PC 밧드 세트 (투명)',
      cat: 'biz',
      sub: '밧드·튀김',
      spec: '폴리카보네이트 · 6종 / 10종',
      img: 'assets/products/pro-03-bat-fryer.jpg',
      tags: 'PC 밧드 바트 투명 용기 업소 냉장',
      price: 34000,
      unit: '세트',
      options: [
        { label: '6종 세트', price: 34000 },
        { label: '10종 세트', price: 52000 }
      ],
      desc:
        '내용물이 보이는 투명 PC 밧드입니다. 냉장·냉동 보관과 재료 계량에 쓰기 좋고, 깨지지 않아 위생 관리가 쉽습니다.',
      specs: [
        ['재질', '폴리카보네이트(PC)'],
        ['구성', '6종 · 10종'],
        ['내열', '-40℃ ~ 99℃'],
        ['특징', '투명 · 겹침 보관']
      ]
    },
    {
      id: 'home-ih-pot-set',
      name: 'IH 스테인리스 양수냄비 3종 세트',
      cat: 'home',
      sub: '냄비·압력솥',
      spec: '16 · 18 · 20cm · 인덕션 겸용',
      img: 'assets/products/cat-01-pot.jpg',
      tags: '냄비 양수냄비 인덕션 IH 스텐 세트',
      price: 129000,
      unit: '세트',
      options: [
        { label: '3종 세트', price: 129000 },
        { label: '3종 세트 + 뚜껑 3개', price: 149000 }
      ],
      desc:
        '매일 쓰는 크기만 모은 IH 스테인리스 양수냄비 세트입니다. 3중 바닥으로 인덕션에서도 빠르게 데워지고, 양수 손잡이로 국을 옮기기 편합니다.',
      specs: [
        ['재질', '스테인리스 304 (3중 바닥)'],
        ['구성', '16 · 18 · 20cm'],
        ['사용 열원', '인덕션 · 가스 · 하이라이트'],
        ['관리', '식기세척기 사용 가능']
      ]
    },
    {
      id: 'home-induction-pan-set',
      name: '인덕션 코팅 프라이팬 2종 세트',
      cat: 'home',
      sub: '프라이팬·웍',
      spec: '24 · 28cm · PFOA-free 코팅',
      img: 'assets/products/cat-02-pan.jpg',
      tags: '프라이팬 후라이팬 인덕션 코팅 세트',
      price: 79000,
      unit: '세트',
      options: [
        { label: '24 · 28cm', price: 79000 },
        { label: '24 · 28cm + 궁중팬', price: 99000 }
      ],
      desc:
        '인덕션 바닥을 넣은 코팅 프라이팬 2종 세트입니다. PFOA를 쓰지 않은 코팅으로, 소량 조리에도 기름이 골고루 퍼집니다.',
      specs: [
        ['재질', '알루미늄 + 세라믹 코팅'],
        ['구성', '24 · 28cm (궁중팬 추가 가능)'],
        ['사용 열원', '인덕션 · 가스'],
        ['특징', 'PFOA-free']
      ]
    },
    {
      id: 'home-kettle',
      name: '스테인리스 휘슬 주전자 2.5L',
      cat: 'home',
      sub: '주전자·컵',
      spec: '2.5L · 인덕션 겸용 · 휘슬',
      img: 'assets/products/cat-03-kettle.jpg',
      tags: '주전자 휘슬 스텐 인덕션 2.5L',
      price: 32000,
      unit: '개',
      options: [
        { label: '2.5L', price: 32000 },
        { label: '3.5L (대용량)', price: 39000 }
      ],
      desc:
        '물이 끓으면 휘슬이 울리는 스테인리스 주전자입니다. 넓은 바닥으로 빨리 끓고, 손잡이는 열전도가 낮은 소재로 되어 있습니다.',
      specs: [
        ['용량', '2.5L · 3.5L'],
        ['재질', '스테인리스 304'],
        ['사용 열원', '인덕션 · 가스'],
        ['특징', '휘슬 · 논슬립 손잡이']
      ]
    },
    {
      id: 'home-mug-4p',
      name: '세라믹 머그 4P 세트',
      cat: 'home',
      sub: '주전자·컵',
      spec: '350ml · 4색 · 선물 포장 가능',
      img: 'assets/products/cat-04-mug.jpg',
      tags: '머그컵 세라믹 4P 선물 답례품',
      price: 24000,
      unit: '세트',
      options: [
        { label: '4P 세트', price: 24000 },
        { label: '4P 세트 + 선물 포장', price: 29000 }
      ],
      desc:
        '톤이 다른 네 가지 색으로 구성한 세라믹 머그입니다. 전자레인지·식기세척기 사용이 가능하고, 선물 포장을 선택할 수 있습니다.',
      specs: [
        ['용량', '350ml × 4개'],
        ['재질', '세라믹'],
        ['사용', '전자레인지 · 식기세척기'],
        ['옵션', '선물 포장']
      ]
    },
    {
      id: 'home-pressure-cooker',
      name: 'IH 압력솥 6L',
      cat: 'home',
      sub: '냄비·압력솥',
      spec: '6L · 2중 안전장치 · 인덕션 겸용',
      img: 'assets/products/cat-01-pot.jpg',
      tags: '압력솥 인덕션 6L 밥솥',
      price: 189000,
      unit: '개',
      options: [{ label: '6L', price: 189000 }],
      desc:
        '인덕션에서도 사용할 수 있는 6L 압력솥입니다. 압력 조절밸브와 안전핀을 함께 둔 2중 안전 구조로, 처음 쓰는 분도 부담이 적습니다.',
      specs: [
        ['용량', '6L (4~5인용)'],
        ['재질', '스테인리스'],
        ['사용 열원', '인덕션 · 가스'],
        ['안전', '압력조절밸브 + 안전핀']
      ]
    },
    {
      id: 'home-table-set',
      name: '도자기 식기 4인 세트',
      cat: 'home',
      sub: '식기',
      spec: '밥공기·대접·찬기 · 16P',
      img: 'assets/products/cat-05-plate.jpg',
      tags: '식기 그릇 세트 도자기 4인 선물',
      price: 96000,
      unit: '세트',
      options: [
        { label: '16P (4인)', price: 96000 },
        { label: '24P (4인 + 앞접시)', price: 129000 }
      ],
      desc:
        '밥공기·대접·찬기로 구성한 도자기 식기 세트입니다. 무광 유약으로 마감해 음식 색이 잘 살고, 전자레인지·식기세척기 사용이 가능합니다.',
      specs: [
        ['구성', '16P · 24P (4인 기준)'],
        ['재질', '도자기 (무광 유약)'],
        ['사용', '전자레인지 · 식기세척기'],
        ['원산지', '대한민국']
      ]
    },
    {
      id: 'home-glass-container',
      name: '내열유리 밀폐용기 5종 세트',
      cat: 'home',
      sub: '보관·용기',
      spec: '내열유리 · 4면 잠금 · 5종',
      img: 'assets/products/cat-07-storage.jpg',
      tags: '밀폐용기 내열유리 반찬통 보관',
      price: 39000,
      unit: '세트',
      options: [
        { label: '5종 세트', price: 39000 },
        { label: '5종 세트 × 2세트', price: 72000 }
      ],
      desc:
        '냉장고에서 전자레인지로 바로 옮길 수 있는 내열유리 밀폐용기입니다. 네 면을 잠그는 뚜껑으로 국물이 새지 않습니다.',
      specs: [
        ['구성', '5종 (300ml ~ 1.2L)'],
        ['재질', '내열유리 + 실리콘 패킹'],
        ['사용', '전자레인지 · 오븐 · 냉동'],
        ['특징', '4면 잠금 뚜껑']
      ]
    },
    {
      id: 'home-silicone-tools',
      name: '실리콘 조리도구 6종 세트',
      cat: 'home',
      sub: '조리도구',
      spec: '내열 230℃ · 스테인리스 심',
      img: 'assets/products/cat-06-tool.jpg',
      tags: '조리도구 실리콘 주걱 뒤집개 세트',
      price: 29000,
      unit: '세트',
      options: [{ label: '6종 세트', price: 29000 }],
      desc:
        '코팅팬을 긁지 않는 실리콘 조리도구 6종입니다. 안쪽에 스테인리스 심이 들어 있어 힘을 줘도 휘지 않습니다.',
      specs: [
        ['구성', '뒤집개 · 주걱 · 스패출러 · 집게 등 6종'],
        ['재질', '실리콘 + 스테인리스 심'],
        ['내열', '230℃'],
        ['관리', '식기세척기 사용 가능']
      ]
    },
    {
      id: 'home-gift-set',
      name: '그랑쉐프 선물 세트 (주전자 + 머그 4P)',
      cat: 'home',
      sub: '선물·답례',
      spec: '휘슬 주전자 2.5L + 머그 4P · 쇼핑백',
      img: 'assets/products/cat-04-mug.jpg',
      tags: '선물세트 답례품 주전자 머그 세트',
      price: 58000,
      unit: '세트',
      options: [
        { label: '기본 포장', price: 58000 },
        { label: '명절 선물 포장', price: 64000 }
      ],
      desc:
        '휘슬 주전자와 세라믹 머그 4P를 함께 담은 선물 세트입니다. 쇼핑백과 보자기를 선택할 수 있어 답례품으로 쓰기 좋습니다.',
      specs: [
        ['구성', '주전자 2.5L + 머그 4P'],
        ['포장', '기본 박스 · 명절 선물 포장'],
        ['부속', '쇼핑백 포함'],
        ['비고', '카드 메시지 동봉 가능']
      ]
    },
    {
      id: 'home-water-bottle',
      name: '내열유리 물병 1.5L',
      cat: 'home',
      sub: '보관·용기',
      spec: '1.5L · 냉장고 도어 수납',
      img: 'assets/products/cat-07-storage.jpg',
      tags: '물병 유리 냉장고 보관',
      price: 15000,
      unit: '개',
      options: [
        { label: '1.5L', price: 15000 },
        { label: '1.5L 2개', price: 27000 }
      ],
      desc:
        '냉장고 문 쪽에 세워 두기 좋은 슬림한 내열유리 물병입니다. 넓은 입구로 세척과 보충이 쉽습니다.',
      specs: [
        ['용량', '1.5L'],
        ['재질', '내열유리'],
        ['사용', '냉장 · 전자레인지'],
        ['특징', '슬림형 · 넓은 입구']
      ]
    }
  ]
};
