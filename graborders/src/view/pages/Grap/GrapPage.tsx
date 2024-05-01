import React, { useState, useEffect, useCallback } from "react";
import "../styles/styles.css";
import { useDispatch, useSelector } from "react-redux";
import authSelectors from "src/modules/auth/authSelectors";
import actions from "src/modules/product/list/productListActions";
import selector from "src/modules/product/list/productListSelectors";
import LoadingModal from "src/shared/LoadingModal";
import Dates from "src/view/shared/utils/Dates";
import recordActions from "src/modules/record/form/recordFormActions";
import recordListAction from "src/modules/record/list/recordListActions";
import recordSelector from "src/modules/record/list/recordListSelectors";
import sound from "/Audio/slots.mp3";

import { useHistory } from "react-router-dom";
import authActions from "src/modules/auth/authActions";
import Amount from "src/shared/Amount";
const iconHeight = 79;
const numIcons = 9;
const timePerIcons = 100;

const Grappage = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const record = useSelector(authSelectors.selectCurrentUser);
  const items = useSelector(selector.selectRows);
  const loading = useSelector(selector.selectLoading);
  // const numberRecord = useSelector(recordSelector.selectCount);
  const [showModal, setShowModal] = useState(false);
  const [lodingRoll, setLoadingRoll] = useState(false); 
  const selectCountRecord = useSelector(recordSelector.selectCountRecord)

  const error = useSelector(recordSelector.selectError);

  const refreshItems = useCallback(() => {
    dispatch(recordListAction.doFetch());
    dispatch(actions.doFetch());
    dispatch(authActions.doRefreshCurrentUser())
  }, [dispatch]);

  const roll = useCallback(async (reel, offset = 0) => {
    const delta =
      (offset + 2) * numIcons + Math.round(Math.random() * numIcons);

    const style = getComputedStyle(reel);
    const backgroundPositionY = parseFloat(style["background-position-y"]);
    const targetBackgroundPositionY = backgroundPositionY + delta * iconHeight;
    const normTargetBackgroundPositionY =
      targetBackgroundPositionY % (numIcons * iconHeight);

    reel.style.transition = `background-position-y ${
      (8 + 1 * delta) * timePerIcons
    }ms cubic-bezier(.41,-0.01,.63,1.09)`;
    reel.style.backgroundPositionY = `${
      backgroundPositionY + delta * iconHeight
    }px`;

    await new Promise((resolve) =>
      setTimeout(resolve, (8 + 1 * delta) * timePerIcons + offset * 150)
    );

    reel.style.transition = `none`;
    reel.style.backgroundPositionY = `${normTargetBackgroundPositionY}px`;
    return delta % numIcons;
  }, []);

  const rollAll = async () => {

    try {
      setLoadingRoll(true)
     await dispatch(recordListAction.doCheck());
      if (error) {
        return;
      }
      const audio = new Audio(sound);
      audio.play();

      const reelsList = document.querySelectorAll(".slots > .reel");
      await Promise.all(Array.from(reelsList).map((reel, i) => roll(reel, i)));

      const slots = document.querySelector(".borders");
      if (slots) {
        slots.classList.add("win1");
        await dispatch(actions.doFetch());
        setTimeout(() => {
          setShowModal(true);
        }, 2000);
      }
      setTimeout(() => {
        if (slots) slots.classList.remove("win1");
      }, 2000);
      setLoadingRoll(false)

    } catch (error) {
      console.log(error);
      // Handle other errors
      setLoadingRoll(false)
    }
    }



  const hideModal = () => {
    setShowModal(false);
  };

  const [number] = useState(Dates.Number());



  useEffect(() => {
   dispatch(recordListAction.doCount())
  }, [dispatch]);



  const calcule__total = (price, comission) => {
    const total =
      (parseFloat(price) * parseFloat(comission)) / 100;
    return total.toFixed(3);
  };

  const currentUser = useSelector(authSelectors.selectCurrentUser);

  const submit = () => {
    const values = {
      number: number,
      product: items?.id,
      status: "completed",
      user: currentUser.id,
    };
    dispatch(recordActions.doCreate(values));
    setShowModal(false);
  };

  const goto =(param) => {
    history.push(param)
  }
  return (
    <>
      <div className="app__grappage">
        <div className="online__service">
          <h4>Grap</h4>
        </div>

        <div className="grap__order">
          <div className="order__top">
            <div className="first__order">
              <div className="vip__title"> {record?.vip?.title}</div>
              <div>
                <label className="vip__commission">Commission Rate: </label>
                <label className="comission">
                  {record?.vip?.comisionrate}%
                </label>
              </div>
            </div>
            <div className="second__order">
              <div>
                <span className="exclusive__channel">
                  Exclusive channel for exclsuive members
                </span>
              </div>
            </div>
          </div>

          <div className="borders">
            <div className="slots">
              <div className="reel"></div>
              <div className="reel"></div>
              <div className="reel"></div>
            </div>
          </div>

          <div style={{ paddingTop: 10 }}>
            <span className="exclusive__chaneels">
              Exclusive channel for exclsuive members
            </span>
          </div>
        </div>

        <div className="button__grap">
          <button className="button__upgrade" onClick={() => goto("/online")}>Deposit Upgrade</button>
          <button className={`grap ${lodingRoll ? '__disabled' : ''}`} onClick={() => rollAll()} disabled={lodingRoll}>
            Automatic grab
          </button>
        </div>

        <div className="order__comission">
          <div className="today__achievements">
            <div className="comission__title">Today's achievements</div>
            <div className="achivemnts__refreshe">
              <i
                className="fa-solid fa-rotate-right click"
                onClick={() => refreshItems()}
              ></i>
            </div>
          </div>

          <div className="achievements__group">
            <div className="group__comission">
              <div className="comission__text">Comission</div>
              <div className="comission__value">
                {record?.vip?.comisionrate}%
              </div>
            </div>
            <div className="group__comission">
              <div className="comission__text"> Availbale Balance </div>
              <div className="comission__value">{Amount.Dollar(record?.balance)}</div>
            </div>
            <div className="group__comission">
              <div className="comission__text">Orders Completed</div>
              <div className="comission__value"> {selectCountRecord}</div>
            </div>
            <div className="group__comission">
              <div className="comission__text">Total Orders</div>
              <div className="comission__value">{record?.vip?.dailyorder}</div>
            </div>
          </div>

          <div className="comission__smallmessage">
            A higher rank member can unlock more orders and get more commission
          </div>
        </div>

        <div className="rules__description">
          <div className="rules__title">Rules Description</div>
          <ul className="rules__list">
            <li>
              (1) Every members from this room be able to grap 55 orders per day
            </li>
            <li>
              (2) The commission of the purchase would be 0.28% of each order
              amount
            </li>
            <li>
              (3) The system automatic dispatch the products throught the cloud.
            </li>
            <li>
              (4) if the order is not confirmed and submitted bu the member
              after the product successfully dispatch, he/she might not be able
              to continue to grab the orders. The member need to process with
              the previous order to continue with the task.
            </li>
          </ul>
        </div>

        {loading && <LoadingModal />}

        {showModal && (
          <div className="modal__grap">
            <div className="modal__product">
              <div className="single__product">
                <div className="single__header">{items?.vip?.title}</div>
                <div className="order__time">
                  <div>Order Time: {Dates.current()}</div>
                  <div>Order Number: N{number}</div>
                </div>
                <div className="badge__ pending">
                  <label>Pending</label>
                </div>
                <div className="product__image">
                  <div className="image__">
                    <img src={items?.photo[0]?.downloadUrl} alt="" /> 
                  </div>

                  <div className="product__detail">
                    <div className="detail__name">{items?.title}</div>
                    <div className="detail__price">
                      <div> {items?.amount}</div>
                      <div>X 1</div>
                    </div>
                  </div>
                </div>

                <div className="bottom__cadre">
                  <div className="cadre__detail">
                    <div>Total order amount</div>
                    <div>{items?.amount} USDT</div>
                  </div>

                  <div className="cadre__detail">
                    <div>Commission</div>
                    <div>{items?.commission}%</div>
                  </div>

                  <div className="cadre__detail">
                    <div>Estimated return</div>
                    <div>
                      {calcule__total(items?.amount, items?.commission)} USDT
                    </div>
                  </div>
                </div>

                <div className="bottom__submit">
                  <div className="submit__ligne"></div>
                  <div className="sumbit__buttons">
                    <div
                      className="cancel__product"
                      onClick={() => hideModal()}
                    >
                      Cancel
                    </div>
                    <div className="submit__product" onClick={() => submit()}>
                      Submit
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Grappage;
