function createDwellClick({ duration = 700, onClick }) {
  let timer;
  return { start: () => { timer = setTimeout(onClick, duration); }, cancel: () => clearTimeout(timer) };
}
module.exports = { createDwellClick };
