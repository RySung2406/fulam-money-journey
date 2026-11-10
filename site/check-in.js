// Completion comes only from the database, never local storage or an optimistic click.
export function createCheckInController({ getClient, onChange }) {
  let generation = 0;
  let userId;
  let state = emptyState();
  function emptyState() {
    return { phase: 'idle', days: [], records: [], reveals: [], message: '', isError: false };
  }
  function emit(patch) { state = { ...state, ...patch }; onChange(state); }
  function nextDay() {
    return state.days.find(day => day.is_open && !state.records.some(record => record.day_number === day.day_number))?.day_number;
  }
  function validDay(day) { return Number.isInteger(day) && day >= 1 && day <= 21; }
  function validChoice(value) { return value == null || value === 'A' || value === 'B' || value === 'C'; }
  function validRecord(row) {
    return row && validDay(row.day_number) && row.student_confirmed === true && Number.isFinite(Date.parse(row.checked_in_at)) && validChoice(row.choice);
  }
  function validText(value) { return typeof value === 'string' && value.trim().length > 0; }
  function validReveal(row) {
    return row && validDay(row.day_number) && (row.letter === 'A' || row.letter === 'B' || row.letter === 'C')
      && ['nick', 'exp_zh', 'exp_en', 'src_zh', 'src_en', 'take_zh', 'take_en'].every(key => validText(row[key]))
      && typeof row.src_url === 'string' && /^https:\/\/\S+$/.test(row.src_url);
  }
  function validReveals(rows) {
    return Array.isArray(rows) && rows.every(validReveal) && new Set(rows.map(row => row.day_number)).size === rows.length;
  }
  async function loadReveals(client) {
    const { data, error } = await client.rpc('get_check_in_reveals');
    if (error) throw error;
    if (!validReveals(data)) throw new Error('invalid-check-in-data');
    return [...data].sort((left, right) => left.day_number - right.day_number);
  }
  async function refresh() {
    if (!userId || ['loading', 'submitting'].includes(state.phase)) return;
    const attempt = generation;
    const currentUser = userId;
    emit({ phase: 'loading', message: '', isError: false });
    try {
      const client = getClient();
      const [daysResult, recordsResult, revealsResult] = await Promise.all([
        client.rpc('get_check_in_schedule'),
        client.from('check_ins').select('day_number,checked_in_at,student_confirmed,choice').eq('user_id', currentUser).order('day_number'),
        client.rpc('get_check_in_reveals')
      ]);
      if (attempt !== generation) return;
      if (daysResult.error || recordsResult.error || revealsResult.error) throw daysResult.error || recordsResult.error || revealsResult.error;
      const days = daysResult.data;
      const records = recordsResult.data;
      const reveals = revealsResult.data;
      if (!Array.isArray(days) || days.length !== 21 || new Set(days.map(day => day.day_number)).size !== 21
          || !days.every(day => validDay(day.day_number) && typeof day.is_open === 'boolean')
          || !Array.isArray(records) || !records.every(validRecord) || !validReveals(reveals)) throw new Error('invalid-check-in-data');
      emit({ phase: 'ready', days, records, reveals: [...reveals].sort((left, right) => left.day_number - right.day_number) });
    } catch {
      if (attempt !== generation) return;
      emit({ phase: 'error', message: '暫時未能載入打卡紀錄，請重試。', isError: true });
    }
  }
  async function submit(day, choice) {
    const open = state.days.some(item => item.day_number === day && item.is_open);
    const record = state.records.find(item => item.day_number === day);
    if (!userId || state.phase !== 'ready' || !open || (record && record.choice != null) || (choice !== 'A' && choice !== 'B' && choice !== 'C')) return;
    const attempt = generation;
    emit({ phase: 'submitting', message: '', isError: false });
    try {
      const { data, error } = await getClient().rpc('submit_check_in', {
        p_day_number: day, p_student_confirmed: true, p_choice: choice
      });
      if (attempt !== generation) return;
      if (error) throw error;
      if (!Array.isArray(data) || data.length !== 1 || !validRecord(data[0]) || data[0].day_number !== day) {
        throw new Error('unconfirmed-check-in');
      }
      let reveals = state.reveals;
      try { reveals = await loadReveals(getClient()); }
      catch { /* The saved check-in still stands. A later reload can fetch its explanation. */ }
      if (attempt !== generation) return;
      emit({ phase: 'ready', records: [...state.records.filter(row => row.day_number !== day), data[0]], reveals,
        message: '答案已提交！正確答案及歷史解說將於翌日公布。今天的目標不只是猜中，而是學會用金融概念理解真實事件。' });
    } catch (error) {
      if (attempt !== generation) return;
      if (error?.message === 'check_in_choice_invalid') {
        emit({ phase: 'ready', message: '請先選擇一個答案。', isError: true });
      } else if (error?.message === 'check_in_day_closed' || error?.message === 'check_in_day_invalid') {
        emit({ phase: 'ready', days: state.days.map(row => row.day_number === day ? { ...row, is_open: false } : row),
          message: '這一天暫未開放打卡。', isError: true });
      } else if (error?.message === 'check_in_auth_required' || error?.code === 'PGRST301' || error?.code === 'PGRST303') {
        emit({ phase: 'error', message: '登入已失效，請重新整理頁面再登入。', isError: true });
      } else {
        emit({ phase: 'ready', message: '未能確認打卡結果，請重試；重試不會重複記錄。', isError: true });
      }
    }
  }
  return {
    get state() { return state; }, nextDay, refresh, submit,
    setUser(id) {
      generation += 1;
      userId = id;
      state = emptyState();
      onChange(state);
      return id ? refresh() : Promise.resolve();
    }
  };
}
