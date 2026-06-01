import styles from './About.module.css'
import moshGif from  '../../assets/mosh.gif'
export default function About() {
    return (
        <section className={styles.about}>
            <div className={styles.card}>
                <div className={styles.photo}>
                    <img src={moshGif} />
                </div>

                <div className={styles.terminal}>
                    <div className={styles.titleBar}>
                        <div className={`${styles.dot} ${styles.dotCore}`} />
                        <div className={`${styles.dot} ${styles.dotWave}`} />
                        <div className={`${styles.dot} ${styles.dotGlitch}`} />
                    </div>

                    <div className={styles.content}>
                        <div className={styles.command}>&gt; whoami</div>

                        <br />

                        <div className={styles.name}>ENERGON_715</div>

                        <div className={styles.text}>
                            Building systems from chaos.
                        </div>

                        <br />

                        <div className={styles.command}>&gt; sys.info</div>

                        <div className={styles.text}>
                            age: 20
                            <br />
                            location: Kazan, RU
                            <br />
                            status:
                            <span className={styles.highlight}> School 21</span>
                            <br />
                            role:
                            <span className={styles.highlight}> Business Analyst</span>
                        </div>

                        <br />

                        <div className={styles.command}>&gt; stack.load</div>

                        <div className={styles.text}>
                            [ C ] [ C++ ] [ Go ]
                            <br />
                            [ React ] [ TypeScript ]
                            <br />
                            [ PostgreSQL ]
                        </div>

                        <br />

                        <div className={styles.command}>
                            &gt; _
                            <span className={styles.cursor}>█</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}