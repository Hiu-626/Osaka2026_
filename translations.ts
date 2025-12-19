
export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    tabs: {
      schedule: '行程',
      bookings: '票券',
      expense: '記帳',
      journal: '日誌',
      planning: '清單',
      members: '成員'
    },
    common: {
      save: '儲存',
      done: '完成',
      cancel: '取消',
      delete: '刪除',
      edit: '編輯',
      add: '新增',
      loading: '載入中...',
      empty: '目前空空如也'
    },
    schedule: {
      startsIn: '冒險即將開始',
      days: '天',
      humidity: '濕度',
      rainProb: '降雨機率',
      emptyDay: '這天沒行程',
      tapToAdd: '點擊 + 新增景點',
      settings: '行程設定',
      region: '區域',
      startDate: '開始日期',
      addStop: '新增景點',
      editStop: '編輯景點',
      location: '地點',
      time: '時間',
      category: '分類',
      travelInfo: '交通資訊'
    },
    bookings: {
      header: '票券與住宿',
      sub: '預訂管理',
      newTicket: '新票券',
      accommodation: '住宿',
      boardingPass: '登機證',
      rentalTicket: '租車票券',
      reservation: '餐廳預約',
      entryVoucher: '入場憑證',
      checkIn: '入住',
      checkOut: '退房'
    },
    expense: {
      totalSpent: '旅程總支出估算',
      addExpense: '新增支出',
      settlement: '結算建議',
      myBalance: '我的分帳狀態',
      receivable: '應收回',
      payable: '應支付',
      settled: '旅程已結清！',
      history: '記帳日誌',
      paidBy: '付款人',
      splitWith: '與誰分帳',
      calc: '匯率換算器'
    },
    journal: {
      header: '旅遊日誌',
      sub: '共享回憶',
      newMemory: '記錄瞬間',
      postAs: '發佈身分'
    },
    planning: {
      packing: '行李',
      shopping: '購物',
      progress: '清單進度',
      addItem: '新增項目',
      everyone: '大家'
    },
    members: {
      active: '目前的規劃者',
      tripOhana: '旅伴成員',
      export: '導出回憶報告 (PDF)',
      leave: '離開旅程',
      newTraveler: '新成員',
      join: '加入 OHANA'
    }
  },
  en: {
    tabs: {
      schedule: 'Schedule',
      bookings: 'Bookings',
      expense: 'Expense',
      journal: 'Journal',
      planning: 'Planning',
      members: 'Members'
    },
    common: {
      save: 'Save',
      done: 'Done',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      loading: 'Loading...',
      empty: 'Empty list'
    },
    schedule: {
      startsIn: 'Adventure Starts In',
      days: 'Days',
      humidity: 'Humidity',
      rainProb: 'Rain Prob.',
      emptyDay: 'Empty Day',
      tapToAdd: 'Tap + to add a stop',
      settings: 'Trip Settings',
      region: 'Region',
      startDate: 'Start Date',
      addStop: 'Add New Stop',
      editStop: 'Edit Stop',
      location: 'Location',
      time: 'Time',
      category: 'Category',
      travelInfo: 'Travel Info'
    },
    bookings: {
      header: 'Tickets & Stays',
      sub: 'Booking Management',
      newTicket: 'New Ticket',
      accommodation: 'Accommodation',
      boardingPass: 'Boarding Pass',
      rentalTicket: 'Rental Ticket',
      reservation: 'Reservation',
      entryVoucher: 'Entry Voucher',
      checkIn: 'Check In',
      checkOut: 'Check Out'
    },
    expense: {
      totalSpent: 'Total Estimated Spent',
      addExpense: 'Add Expense',
      settlement: 'Settlement Advice',
      myBalance: 'My Balance',
      receivable: 'Receivable',
      payable: 'Payable',
      settled: 'Trip settled!',
      history: 'Expense Log',
      paidBy: 'Paid By',
      splitWith: 'Split With',
      calc: 'Currency Converter'
    },
    journal: {
      header: 'Travel Journal',
      sub: 'Shared Memories',
      newMemory: 'Record Memory',
      postAs: 'Post As'
    },
    planning: {
      packing: 'Packing',
      shopping: 'Shopping',
      progress: 'Checklist Progress',
      addItem: 'Add Item',
      everyone: 'Everyone'
    },
    members: {
      active: 'Active Trip Planner',
      tripOhana: 'Trip Ohana',
      export: 'Export Memory (PDF)',
      leave: 'Leave Trip',
      newTraveler: 'New Traveler',
      join: 'JOIN THE OHANA'
    }
  }
};
