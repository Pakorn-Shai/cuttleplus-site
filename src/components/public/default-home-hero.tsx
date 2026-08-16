import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

/**
 * Core fallback hero used when the active theme does not ship its own.
 * It intentionally ignores the hero data props so it can act as a static
 * fallback for any theme that does not provide a custom HomeHero.
 */
export function DefaultHomeHero() {
  return (
    <section className="hero"><div className="container hero-inner">
      <div><p className="eyebrow">Personal Knowledge Library</p><h1>เก็บสิ่งที่เรียนรู้<br /><em>ให้กลับมาเข้าใจได้เสมอ</em></h1><p className="hero-copy">พื้นที่สำหรับบันทึก จัดระเบียบ และเชื่อมโยงความรู้จากงานและสิ่งที่สนใจ — ออกแบบเพื่อการอ่านที่สบายและค้นพบได้ง่าย</p><div className="hero-actions"><Link className="primary-button" href="/knowledge">สำรวจคลังความรู้ <ArrowRight size={16} /></Link><Link className="secondary-button" href="/about">รู้จักฉันมากขึ้น</Link></div></div>
      <div className="knowledge-orbit" aria-hidden="true"><div className="orbit-center"><BookOpen size={70} /></div><span className="orbit-chip">SQL & Data</span><span className="orbit-chip">AI Notes</span><span className="orbit-chip">Programming</span><span className="orbit-chip">Learning</span></div>
    </div></section>
  );
}