function contarAcertos(nAmigo, nSorteio) {
  const a = nAmigo.split(",").map(n => n.trim());
  const s = nSorteio.split(",").map(n => n.trim());
  return a.filter(n => s.includes(n)).length;
}

module.exports = { contarAcertos };
