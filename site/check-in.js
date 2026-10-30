// Completion comes only from the database, never local storage or an optimistic click.
export function createCheckInController({ getClient, onChange }) {
  let generation = 0;
  let userId;
  let state = emptyState();
  function emptyState() {
    return { phase: 'idle', days: [], records: [], studentConfirmed: false, message: '', isError: false };
  }
  function emit(patch) { state = { ...state, ...patch }; onChange(state); }
  function nextDay() {
    return state.days.find(day => day.is_open && !state.records.some(record => record.day_number === day.day_number))?.day_number;
  }
  function validDay(day) { return Number.isInteger(day) && day >= 1 && day <= 21; }
  function validRecord(row) {
    return row && validDay(row.day_number) && row.student_confirmed === true && Number.isFinite(Date.parse(row.checked_in_at));
  }
  async function refresh() {
    if (!userId || ['loading', 'submitting'].includes(state.phase)) return;
    const attempt = generation;
    const currentUser = userId;
    emit({ phase: 'loading', message: '', isError: false });
    try {
      const client = getClient();
      const [daysResult, recordsResult] = await Promise.all([
        client.from('check_in_days').select('day_number,is_open').order('day_number'),
        client.from('check_ins').select('day_number,checked_in_at,student_confirmed').eq('user_id', currentUser).order('day_number')
      ]);
      if (attempt !== generation) return;
      if (daysResult.error || recordsResult.error) throw daysResult.error || recordsResult.error;
      const days = daysResult.data;
      const records = recordsResult.data;
      if (!Array.isArray(days) || days.length !== 21 || new Set(days.map(day => day.day_number)).size !== 21
          || !days.every(day => validDay(day.day_number) && typeof day.is_open === 'boolean')
          || !Array.isArray(records) || !records.every(validRecord)) throw new Error('invalid-check-in-data');
      emit({ phase: 'ready', days, records });
    } catch {
      if (attempt !== generation) return;
      emit({ phase: 'error', message: '暫時未能載入打卡紀錄，請重試。', isError: true });
    }
  }
  async function submit() {
    const day = nextDay();
    if (!userId || state.phase !== 'ready' || !state.studentConfirmed || !day) return;
    const attempt = generation;
    emit({ phase: 'submitting', message: '', isError: false });
    try {
      const { data, error } = await getClient().rpc('submit_check_in', {
        p_day_number: day, p_student_confirmed: true
      });
      if (attempt !== generation) return;
      if (error) throw error;
      if (!Array.isArray(data) || data.length !== 1 || !validRecord(data[0]) || data[0].day_number !== day) {
        throw new Error('unconfirmed-check-in');
      }
      emit({ phase: 'ready', records: [...state.records.filter(row => row.day_number !== day), data[0]],
        message: `第 ${day} 日打卡成功，紀錄已保存。` });
    } catch (error) {
      if (attempt !== generation) return;
      if (error?.message === 'check_in_day_closed' || error?.message === 'check_in_day_invalid') {
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
    setStudentConfirmed(value) {
      if (state.phase === 'submitting') return;
      emit({ studentConfirmed: value === true });
    },
    setUser(id) {
      generation += 1;
      userId = id;
      state = emptyState();
      onChange(state);
      return id ? refresh() : Promise.resolve();
    }
  };
}
