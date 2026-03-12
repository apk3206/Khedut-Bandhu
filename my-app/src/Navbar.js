// import React, { useState } from 'react';
// import './Navbar.css';

// const Navbar = ({ onNavigate, user }) => {
//   const [activeDropdown, setActiveDropdown] = useState(null);

//   const handleDropdown = (menu) => {
//     setActiveDropdown(activeDropdown === menu ? null : menu);
//   };

//   return (
//     <nav className="navbar">
//       <div className="navbar-container">
//         <div className="navbar-left">
//           <div className="emblem-section">
//             <div className="emblem">
//               <div className="ashoka-chakra">☸</div>
//               <div className="emblem-text">
//                 <div>સત્યમેવ જયતે</div>
//                 <div>ગુજરાત સરકાર</div>
//               </div>
//             </div>
//             <div className="logo">ખેડૂત 2.0</div>
//           </div>
//           <div className="department-text">
//             Agriculture, Farmers Welfare & Co-Operation Department<br />
//             Government Of Gujarat
//           </div>
//         </div>

//         <div className="navbar-center">
//           <ul className="nav-menu">
//             <li className="nav-item dropdown" onMouseEnter={() => handleDropdown('schemes')} onMouseLeave={() => handleDropdown(null)}>
//               <a href="#schemes" onClick={(e) => { e.preventDefault(); onNavigate('schemes'); }}>
//                 યોજના <span className="arrow">▼</span>
//               </a>
//               {activeDropdown === 'schemes' && (
//                 <div className="dropdown-menu">
//                   <a href="#pm-kisan" onClick={(e) => { e.preventDefault(); onNavigate('schemes'); }}>PM-KISAN</a>
//                   <a href="#pmfby" onClick={(e) => { e.preventDefault(); onNavigate('schemes'); }}>PMFBY</a>
//                   <a href="#kcc" onClick={(e) => { e.preventDefault(); onNavigate('schemes'); }}>KCC</a>
//                   <a href="#solar" onClick={(e) => { e.preventDefault(); onNavigate('schemes'); }}>Solar Pump</a>
//                 </div>
//               )}
//             </li>
//             <li className="nav-item">
//               <a href="#pesticide" onClick={(e) => { e.preventDefault(); onNavigate('pesticide'); }}>
//                 પેસ્ટિસાઇડ
//               </a>
//             </li>
//             <li className="nav-item">
//               <a href="#seeds" onClick={(e) => { e.preventDefault(); onNavigate('seeds'); }}>
//                 બીજ
//               </a>
//             </li>
//             <li className="nav-item">
//               <a href="#market" onClick={(e) => { e.preventDefault(); onNavigate('market'); }}>
//                 આજની બજાર કિંમત
//               </a>
//             </li>
//             <li className="nav-item">
//               <a href="#help" onClick={(e) => { e.preventDefault(); onNavigate('help'); }}>
//                 મદદ
//               </a>
//             </li>
//             <li className="nav-item">
//               <a href="#complaint" onClick={(e) => { e.preventDefault(); onNavigate('complaint'); }}>
//                 ફરિયાદ
//               </a>
//             </li>
//           </ul>
//         </div>

//         <div className="navbar-right">
//           <button className="profile-btn" onClick={() => onNavigate('profile')}>
//             <span>👤</span> User Profile <span className="arrow">→</span>
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-container">

        <div className="navbar-center">
          <ul className="nav-menu">

            <li className="nav-item">
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/schemes'); }}>
                યોજના
              </a>
            </li>

            <li className="nav-item">
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/pesticide'); }}>
                પેસ્ટિસાઇડ
              </a>
            </li>

            <li className="nav-item">
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/seeds'); }}>
                બીજ
              </a>
            </li>

            <li className="nav-item">
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/market'); }}>
                આજની બજાર કિંમત
              </a>
            </li>

            <li className="nav-item">
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/help'); }}>
                મદદ
              </a>
            </li>

            <li className="nav-item">
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/complaint'); }}>
                ફરિયાદ
              </a>
            </li>

          </ul>
        </div>

        <div className="navbar-right">
          <button className="profile-btn" onClick={() => navigate('/profile')}>
            👤 User Profile →
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

