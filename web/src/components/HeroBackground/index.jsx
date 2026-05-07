import { 
  FileText, FileSearch, ShieldCheck, FolderOpen, Files, ClipboardList, 
  GraduationCap, Search, FileCheck, History, Globe, Building2, UserCheck,
  LayoutTemplate
} from 'lucide-react';
import gridSvg from '../../assets/svgs/hero-grid.svg';
import waveSvg from '../../assets/svgs/hero-wave.svg';
import './styles.scss';

const HeroBackground = () => (
  <div className="heroBackgroundWrapper">
    <div className="heroBgLayers">
      <img src={gridSvg} className="heroBg grid" alt="" />
      <img src={waveSvg} className="heroBg wave" alt="" />
    </div>

    {/* Floating Icons Set 1 */}
    <div className="floatingIcon icon-1"><FileText size={48} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-2"><ShieldCheck size={56} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-3"><FolderOpen size={52} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-4"><FileSearch size={64} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-5"><Files size={48} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-6"><ClipboardList size={52} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-7"><GraduationCap size={54} strokeWidth={0.8} /></div>
    
    {/* Floating Icons Set 2 */}
    <div className="floatingIcon icon-8"><Search size={50} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-9"><FileCheck size={48} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-10"><History size={44} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-11"><Globe size={50} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-12"><Building2 size={54} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-13"><UserCheck size={54} strokeWidth={0.8} /></div>
    <div className="floatingIcon icon-14"><LayoutTemplate size={58} strokeWidth={0.8} /></div>
  </div>
);

export default HeroBackground;
