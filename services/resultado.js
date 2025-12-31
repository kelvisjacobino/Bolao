function contarAcertos(nCota, nSorteio) {

  // se vier string -> transforma em array
  const dezenaCota = Array.isArray(nCota)
    ? nCota
    : nCota.split(",");

  const dezenaSorteio = Array.isArray(nSorteio)
    ? nSorteio
    : nSorteio.split(",");

  return dezenaCota.filter(n => dezenaSorteio.includes(n)).length;
}

module.exports = { contarAcertos };

