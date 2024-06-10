import { useEffect, useState } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// import selectors from 'src/modules/vip/list/vipListSelectors';
import Vipactions from "src/modules/vip/list/vipListActions";
import selector from "src/modules/vip/list/vipListSelectors";
import LoadingModal from "src/shared/LoadingModal";
import authSelectors from "src/modules/auth/authSelectors";
import actions from "src/modules/auth/authActions";
import listactions from "src/modules/company/list/companyListActions";
import selectors from "src/modules/company/list/companyListSelectors";

function Market() {
  const dispatch = useDispatch();
  const record = useSelector(selector.selectRows);
  const logorecord = useSelector(selectors.selectRows);
  const loadingImage = useSelector(selectors?.selectLoading);
const [timemodal, setBigModal] = useState(true)
  const loading = useSelector(selector.selectLoading);
  const [Modal, setShowModal] = useState(false);
  const currentUser = useSelector(authSelectors.selectCurrentUser);
  const searchAllCoins = async () => {};
  interface DataItem {
    image: string;
    title: string;
    Entrylimit: string;
    levellimit: string;
    dailyorder: string;
    comisionrate: string;
  }
  const [selectedItem, setItems] = useState<DataItem | null>(null);

  const currentDate = () => {
    const californiaTimezone = "America/Los_Angeles"; // Timezone for California
    const options = { timeZone: californiaTimezone };
    const currentDateTime = new Date().toLocaleString("en-US", options);
    return currentDateTime;
  };
  
  const dolistCompany = () => {
    dispatch(listactions.doFetch());
  };

  useEffect(() => {
    dolistCompany();
    searchAllCoins();
    dispatch(Vipactions.doFetch());
    currentDate();

    // eslint-disable-next-line
  }, [dispatch]);

 

  const hideModal = () => {
    setShowModal(false);
  };

  const showModal = (item) => {
    setItems(item);
    setShowModal(true);
  };

  const button__action = [
    {
      icon: "fa-regular fa-building",
      text: "About",
      link: "/company",
    },
    {
      icon: "fa-solid fa-file-contract",
      text: "T&C",
      link: "/tc",
    },
    {
      icon: "fa fa-certificate",
      text: "Certificate",
      link: "/Certificate",
    },
    {
      icon: "fa-solid fa-question",
      text: "FAQs",
      link: "/faqs",
    },
    {
      icon: "fa fa-user-plus",
      text: "Invitation",
      link: "/invitation",
    },
  ];

  const submit = (item) => {
    const balances =
      parseFloat(currentUser?.balance) - parseFloat(item.levellimit);

    const data = {
      vip: item,
      balance: balances,
    };

    dispatch(actions.doUpdateProfile(data));
  };

  const NewsTicker = ({ text }) => {
    return (
      <div className="news-ticker-container">
        <div className="news-ticker">
          <span>{text}</span>
        </div>
      </div>
    );
  };

  const [currentImage, setCurrentImage] = useState(0);
  const images = ["/images/sub__heading.png"];

  useEffect(() => {});

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="market__header">
        {!loadingImage &&
          logorecord.map((item) => (
            <img
              src={item?.photo[0]?.downloadUrl}
              alt=""
              className="logo__header"
            />
          ))}
      </div>

      <div className="advertise__header">
        {images.map((image, index) => (
          <div
            key={index}
            style={{ display: index === currentImage ? "block" : "none" }}
          >
            <img src={image} alt={`Image ${index + 1}`} className="image" />
          </div>
        ))}
      </div>
      <div className="home__section">
        <div className="advertise__speaker">
          <div>
            <i className="fa-solid fa-volume-off speaker"></i>
          </div>
      

          <div className="marquee">
          <span>Dear users, welcome to join us. The daily working hours are from 10:00 am to 23:00 pm Eastern. If you keep working for 4 days, you will be paid 200$. If you keep working for 7 days, you can get 500$. If you keep working for 10 days, you will be paid 1,000 USD. If you stay on the job for 20 days, you will be paid $2,500. If you stay on the job for 30 days, you will be paid $3,500</span>
        </div>
          <NewsTicker
            text=""
          />
        </div>

        <div className="advertise__buttons">
          <Link
            to="/online"
            className="button__deposit"
            style={{ textDecoration: "none" }}
          >
            <div>Deposit</div>
          </Link>
          <Link
            to="/withdraw"
            className="button__withdraw"
            style={{ textDecoration: "none" }}
          >
            {" "}
            Withdraw
          </Link>
        </div>
        <div className="adverstise__actions">
          {button__action.map((item) => (
            <Link to={item.link} className="remove__ligne">
              <div className="button__action">
                <div className="action__cirlce">
                  <i className={`${item.icon} icon__action`}></i>
                </div>
                <label htmlFor="" className="action__label">
                  {item.text}
                </label>
              </div>
            </Link>
          ))}
        </div>

        <div className="advertise__content">
          <div className="content__header">
            <h3 className="hall">Business Hall</h3>
            {loading && <LoadingModal />}
            {!loading && record && (
              <div className="content__vip">
                {record?.map((item, index) => (
                  <div
                    className="vip"
                    onClick={() => showModal(item)}
                    key={index}
                  >
                    {currentUser?.vip?.id === item.id ? (
                      <div className="success__vip"></div>
                    ) : (
                      <div className="subscribe__"></div>
                    )}
                    <div className="vip__image">
                      <img
                        src={item?.photo[0]?.downloadUrl}
                        alt="Vip__image"
                        className="vip__level"
                      />
                    </div>
                    <div className="vip__text">
                      <div className="vip__title">{item.title}</div>
                      <div className="vip__details">
                        <div className="vip__description">
                          <div className="description__key">Entry Limit:</div>
                          <div className="description__value">
                            {item.levellimit}
                          </div>
                        </div>

                        <div className="vip__description">
                          <div className="description__key">Daily order:</div>
                          <div className="description__value">
                            {item.dailyorder}
                          </div>
                        </div>
                        <div className="vip__description">
                          <div className="description__key">
                            Comimsion rate:
                          </div>
                          <div className="description__value">
                            {" "}
                            {item.comisionrate}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="content__footer"></div>
        </div>
      </div>
      {selectedItem && Modal && (
        <div className="modal__grap">
          <div className="modal__product">
            <div className="single__product">
              <div className="single__header">{selectedItem?.title}</div>

              <div className="order__time">
                <div style={{ fontSize: 20 }}>
                  Level Limit: {selectedItem?.levellimit}
                </div>
                <div style={{ fontSize: 20 }}>
                  Daily order: {selectedItem?.dailyorder}
                </div>
                <div style={{ fontSize: 20 }}>
                  Commission Rate: {selectedItem?.comisionrate}
                </div>
              </div>
              <div className="badge__ pending">
                <label>Pending</label>
              </div>

              <div className="bottom__submit">
                <div className="submit__ligne"></div>
                <div className="sumbit__buttons">
                  <div className="cancel__product" onClick={() => hideModal()}>
                    Cancel
                  </div>
                  <div
                    className="submit__product"
                    onClick={() => submit(selectedItem)}
                  >
                    Submit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {timemodal && <div className="big__modal">
      <div className="modal__time">

      {logorecord.map((item) => (
            <>
              <span className="modal__companyname">{item.name}</span>
              {!loadingImage && item?.photo[0]?.downloadUrl && (
                <img
                  src={item?.photo[0]?.downloadUrl}
                  alt=""
                  style={{width:190}}
                />
              )}
              {!loadingImage && !item?.photo[0]?.downloadUrl && (
                <img
                  src="/images/invitation/logo.png"
                  alt=""
                  className="invitation__"
                />
              )}
            </>
          ))}
        <div className="time__">
          Each time user completed a set of optimisation tasks, they can
          immedialy approch the platform's customer serivice to receive a random
          bonus
        </div>
        <div className="close" onClick={() => setBigModal(!timemodal)}>
          <i className="fa fa-close closa" />
        </div>
      </div>
      </div> }

    </div>
  );
}

export default Market;
