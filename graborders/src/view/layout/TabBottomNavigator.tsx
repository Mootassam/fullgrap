import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./styles/style.css";
import { i18n } from "../../i18n";


function TabBottomNavigator() {
  const location = useLocation();

  const isActive = (pathname) => location.pathname === pathname;

  const tabs = [
    {
      icon: "fas fa-home",
      path: "/",
      name: i18n('pages.tabBottomNavigator.home'),
    },
    {
      icon: "fas fa-exchange-alt",
      path: "/grap",
      name: i18n('pages.tabBottomNavigator.grap'),
    },
    {
      icon: "fa-solid fa-clipboard-list",
      path: "/Order",
      name: i18n('pages.tabBottomNavigator.records'),
    },
  ];

  return (
    <div className="tabbottomNavigator">
      {tabs.map((item, index) => (
        <Link
          key={index}
          to={item.path}
          style={{ color: "grey", textDecoration: "none" }}
        >
          {item.path === "/grap" ? (
            <div className="grap__cirlce">
              <i className="fa fa-bolt white "></i>
              
            </div>
          ) : (
            <div className="singleTab">
              <i
                style={{ fontSize: 21 }}
                className={`${item.icon} ${isActive(item.path) && "active"}`}
              ></i>
              <p className={`text__link ${isActive(item.path) && "active"}`}>
                {item.name}
              </p>
            </div>
          )}
        </Link>
      ))}

      <style>{`
        .grap__cirlce {
         background-color: #24557f;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    position: relative;
    top: -18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
        }
      `}</style>
      
                </div>
  );
}

export default TabBottomNavigator;