import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import "../styles/styles.css";
import { Link } from "react-router-dom";
import authActions from "src/modules/auth/authActions";
import authSelectors from "src/modules/auth/authSelectors";
import Amount from "src/shared/Amount";
import { useHistory } from "react-router-dom"; // Assuming you're using React Router
import actions from 'src/modules/record/list/recordListActions';
import selectors from "src/modules/record/list/recordListSelectors";
import { log } from "console";

function Profile() {
  const dispatch = useDispatch();
  const total = useSelector(selectors.selectTotal);
  const totalperday = useSelector(selectors.selectTotalPerday)

  useEffect(() => {
    const values = {
      "status": "completed"
    };
    dispatch(actions.doCountDay());
    dispatch(actions.doFetch(values, values));
  }, [dispatch]);



  

  const doSignout = () => {
    dispatch(authActions.doSignout());
  };
  const history = useHistory();

  const goto = (param) => {
    history.push(param);
  };
  const currentUser = useSelector(authSelectors.selectCurrentUser);
  const data = [
    {
      icon: "fa-solid fa-clock-rotate-left",
      name: "Tasks History",
      url: "/order",
    },
    { icon: "fa-solid fa-wallet", name: "Bind Wallet", url: "/wallet" },
    {
      icon: "fa-solid fa-arrow-right-arrow-left",
      name: "Transactions",
      url: "/transacation",
    },
    {
      icon: "fa-solid fa-money-bill-transfer",
      name: "Withdraw",
      url: "/withdraw",
    },
    { icon: "fa-solid fa-user", name: "Profile", url: "/myprofile" },
    { icon: "fa-solid fa-lock", name: "Security", url: "/security" },
  ];

  return (
    <div className="app__profile">
      {/* <div className="profile__arc">


        <div className="arc__header">
          <div className="arc__left">
        <img src="/icons/vip.png" alt=""  className="diamond__vip" /> 
          <div className="dashboard__title">{currentUser?.vip?.title}</div>
          </div>
          <div className="arc__right" onClick={()=> doSignout()}>
          <i className="fa-solid fa-right-from-bracket " style={{ color:"white", fontSize:30, cursor:'pointer'}}></i>
          </div>
        </div>
        <div className="dashboard__user">
          Hi, {currentUser?.fullName}!
        </div>

        <div className="dashbaord__balance">
        <label htmlFor="" className="label__balance">Total Balance</label>
        <span className="total__amount">{Amount.Dollar(currentUser?.balance)}</span>
        </div>

      </div>
      

      <div className="button__profile">
        <div className="send__money" onClick={() => goto("/online")}>
          <img src="/icons/send.svg" alt="" />
          Deposit Money
        </div>

        <div  className="receive_money" onClick={() => goto("/withdraw")}>
        <img src="/icons/request.svg" alt="" />
          Request Money
  
        </div>
   
      </div>

      <div className="profile__content">
        {data.map((item, index) => (
          <Link to={item.url} className="remove__ligne" key={index}>
            <div className="tasks__">
            <div className="profile__link">
              <div className="profile__links">
              <div>
                <i className={`${item.icon} profile__icon`}></i>
              </div>
              <div>{item.name}</div>
            </div>
            </div>
            <div>
              <i className="fa fa-arrow-right " ></i>
            </div>
            </div>
          </Link>
        ))}
      </div> */}

      <div className="profiles__header">
        <div className="header__background"></div>
        <div className="carde__profile">
          <div className="cadre__top">
            <div className="cadre__left">
              <div>
                <img src="/images/user.png" alt="" style={{ height: 70 }} />
              </div>
              <div className="left__details">
                <div className="user__title">{currentUser?.fullName}</div>
                <div className="small__invitation">
                  {" "}
                  InvitationCode : LDEKZS
                </div>
              </div>
            </div>
            <div className="cadre__right"></div>
          </div>
          <div className="cadre__ligne"></div>
          <div className="cadre__bottom">
            <div className="firt__cadre">
              <span className="title__cadre">Wallet Amount</span>
              <span className="amount__cadre">
                {currentUser?.balance?.toFixed(2) || 0.0} USDT
              </span>
            </div>
            <div className="second__cadre"></div>
            <div className="">
              <span className="title__cadre">Daily Comission</span>
              <span className="amount__cadre">{totalperday} USDT </span>
            </div>
            <div className="second__cadre"></div>
            <div>
              <span className="title__cadre">Total Profit </span>
              <span className="amount__cadre">{total} USDT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile__content">
        <div>
          <label htmlFor="" className="titre">
            My Financial
          </label>
          <div className="detail__section">
            <div
              className="line__section border__"
              onClick={() => goto("/online")}
            >
              <div className="titre__section">
                <i className="fa-solid fa-paper-plane" />
                <span>Deposit</span>
              </div>
              <div>
                <i className="fa fa-arrow-right " />
              </div>
            </div>
            <div className="line__section" onClick={() => goto("/withdraw")}>
              <div className="titre__section">
                <i className="fa-solid fa-money-check" />
                <span>Withdraw</span>
              </div>
              <div>
                <i className="fa fa-arrow-right " />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="" className="titre">
            My Details
          </label>
          <div className="detail__section">
            <Link to="/myprofile" className="remove__ligne">
              <div className="line__section border__">
                <div className="titre__section">
                  <i className="fa-solid fa-user profile__icon"></i>
                  <span>Profile</span>
                </div>
                <div>
                  <i className="fa fa-arrow-right " />
                </div>
              </div>
            </Link>
            <Link to="/wallet" className="remove__ligne">
              <div className="line__section">
                <div className="titre__section">
                  <i className="fa-solid fa-wallet profile__icon"></i>
                  <span>Wallet</span>
                </div>
                <div>
                  <i className="fa fa-arrow-right " />
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div>
          <label htmlFor="" className="titre">
            Other
          </label>
          <div className="detail__section">
            <Link to="/transacation" className="remove__ligne">
              <div className="line__section border__">
                <div className="titre__section">
                  <i className="fa-solid fa-arrow-right-arrow-left profile__icon"></i>
                  <span>Transaction</span>
                </div>
                <div>
                  <i className="fa fa-arrow-right " />
                </div>
              </div>
            </Link>
            <Link to="/order" className="remove__ligne">
              <div className="line__section border__">
                <div className="titre__section">
                  <i className="fa-solid fa-clock-rotate-left profile__icon"></i>
                  <span>Tasks History</span>
                </div>
                <div>
                  <i className="fa fa-arrow-right " />
                </div>
              </div>
            </Link>
            <Link to="/security" className="remove__ligne">
              <div className="line__section">
                <div className="titre__section">
                  <i className="fa-solid fa-lock profile__icon"></i>
                  <span>Security</span>
                </div>
                <div>
                  <i className="fa fa-arrow-right " />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="logout__button" onClick={() => doSignout()}>
        {" "}
        Logout
      </div>
    </div>
  );
}

export default Profile;
