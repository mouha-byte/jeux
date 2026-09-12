import './base.css';
export const metadata = { title: 'ProxPlay — Ludo, Échecs, X O, Billard, UNO & Shifumi', description: 'Votre collection de jeux classiques : Ludo, échecs, morpion infini, billard, UNO et pierre-feuille-ciseaux, entre amis ou contre l’ordinateur.', icons: {icon:'/icon.svg'} };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="fr"><body>{children}</body></html> }
