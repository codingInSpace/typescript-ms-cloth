class Spring {
  public p1: number = -1
  public p2: number = -1
  public kd: number = 0.5
  public ks: number = 0.5
  public restLength: number = 0

  constructor(p1, p2, kd, ks, restLength) {
    this.p1 = p1
    this.p2 = p2
    this.kd = kd
    this.ks = ks
    this.restLength = restLength
  }
}

export default Spring