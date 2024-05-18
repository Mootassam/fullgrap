import React,{useEffect} from "react";
import { useDispatch, useSelector } from 'react-redux';

import "../styles/styles.css";
import { Link } from "react-router-dom";
import authActions from 'src/modules/auth/authActions';
import authSelectors from 'src/modules/auth/authSelectors';
import Amount from "src/shared/Amount";
import { useHistory } from 'react-router-dom'; // Assuming you're using React Router

function Profile() {
  const dispatch = useDispatch();
  const doSignout = () => {
    dispatch(authActions.doSignout());
  };
  const history = useHistory();

  const goto =(param) => {
    history.push(param)
  }
  const currentUser= useSelector(authSelectors.selectCurrentUser);
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
      <div className="profile__arc">


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
      </div>
    </div>
  );
}

export default Profile;
