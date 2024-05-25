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
  const selectCountRecord = useSelector(recordSelector.selectCountRecord);

  const error = useSelector(recordSelector.selectError);

  const refreshItems = useCallback(() => {
    dispatch(recordListAction.doFetch());
    dispatch(actions.doFetch());
    dispatch(authActions.doRefreshCurrentUser());
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
      setLoadingRoll(true);
      await dispatch(recordListAction.doCheck());
      if (error) {
        return;
      }
      await dispatch(actions.doFetch());
      setTimeout(() => {
        setShowModal(true);
      }, 2000);

      setLoadingRoll(false);
    } catch (error) {
      console.log(error);
      // Handle other errors
      setLoadingRoll(false);
    }
  };

  const hideModal = () => {
    setShowModal(false);
  };

  const [number] = useState(Dates.Number());

  useEffect(() => {
    dispatch(recordListAction.doCount());
  }, [dispatch]);

  const calcule__total = (price, comission) => {
    const total = (parseFloat(price) * parseFloat(comission)) / 100;
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

  const goto = (param) => {
    history.push(param);
  };
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

          <div className="grap__products">
            <div className="list__ofproduct">
              <div className=""><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfUMVMqVJw2YNtEKM3Wt-bZxs7sBiz0xMZiQ&s" alt=""  /></div>
              <div className=""><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQucfeb4lzxk7TdQQg_vY1Gzgh9ySO2vVkqaQ&s" alt=""  /></div>
              <div className=""><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsUVCB0U6Xg6aTHi-p_-_mHPtUoHQPZbQbCg&s" alt=""  /></div>
            </div>
            <div className="list__ofproduct">
              <div className=""><img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTEhUSExIVFhUXFRcYFRgXFhcYGhUXGRUXFxgVFRgYHyggGB0lHRUYITEhJSkrLi4uFx8zODMtNygtLisBCgoKDQ0OGg8QFzclHR4vLSstNDc3Kys3LTIrKysrLSstLDcrNzItKystLS0tLSstNTcvOC03NzgvKzQ3Kys1K//AABEIAKQBNAMBIgACEQEDEQH/xAAcAAACAgMBAQAAAAAAAAAAAAAAAQIDBAUHBgj/xABCEAABAgQDBQUGBAUDAgcAAAABAAIDESExBBJBEzJRYXEFBiKBkTNCocHw8QcUI9FDUmKCsXKS4VOyJDRjZHOi0v/EABcBAQEBAQAAAAAAAAAAAAAAAAABAwL/xAAmEQEAAQIEBAcAAAAAAAAAAAAAAgEREjFBkQMhYYETMjNxscHR/9oADAMBAAIRAxEAPwDs0R+fwi96/XNNr8oyG/wqlEaGibL+tE2tBGZ296WtRBGG3Z1drwQWEnaaX50RDObftpoguM8vu28uqBxP1N3S8+f2QXzGz1typ9kRPDua316ILQBmG9fzN6ICG7Z0drWiTGFpzm3K9U4YDqvvpokxxJyu3fTpVAPYXnMLWqnEftKNvevp80oji0yZb1TiNDasvbjRANflGQ3tyr90oY2dXa8E2tBGY737WolDObf8tEBkM9ppfmiINpu6cef2RmM8vu28uqInh3Nb6oGXzGzF7cqfZEN2zo7WtEFoAzDev5m9PVENodV9/SiBMYWHMbcuaHsLzmFufJDHFxk63p8UPcWmTbeqBxH7Sjetfrmhr5DIb25V+60vbXerBYWjo7c85FjJxHDkWtnl85LxfaX4rif6GFJP88Z+WRFv02Tn/uCDpsMbPe14IEMzz6X5rhfaX4idoxf4zYY4QobR8X5nD1WhxXbmKib+Kju5GK+X+2ch6IPpDEvDqzDQP5jK6pi9qwJZDGhg0FYjAKefJfMbqmZEzxN/VSD0H01hu1ILRLbQ3Vn4XtPz5K6BIeOYcP6TNfMG1U4ccgzBkeIofVB9PPhlxzC3O9E4jtpRular52wXerGQtzFRhy2jnD/a6Y+C9d2L+KcVgAjQw/QvbIGX+igJ8x0QdbD5DZ625V+6If6e9rw5fdeb7G764PE2iBkQ2DzlroPFIE9Jr0cLxb/logAwz2ml+aIg2lW6cUBxnl923l1REOXc89UDc/MMgv8ACn2RDfs6Oven1yQ5oAzDe/e9EQ2hwm+9uFEChsLDmNrUQ5hcc4tzvRENxcZPt6VQ5xByt3fXrVA4jtpRulaoD5DZ625V+6Igy1ZfXVAaJZjvX89KIIfk3cvryQlt3/QTQSbD2fiNdKfXJBh5jn04dEQySfHbnSqHEzk3d5W5oG520oKSrVGeQ2etp9URJD2d9ZVQAJTO/wDGelEA39O9Z8OX3SEOR2ml5dfunDr7TynTr8kgTOR3PhLSvogHN2lRSVKpmJn8Ap/wlEmPZ21lWqk8CXh3uV+aBNibPwmuqTWbPxGulPX5JwwCPHfnSiUMkn9S3OlfqaAMPMc+l5dPsm47SgpLik4mcm7nK0ta+qcSns/OVUBtKbPW00NOzvWfDl90SEp+/wDGfREOvtPKdOqBBkjtNLy6/dKIM/imAAKz9ZrR94e9UHCza453aQmynL3S4+6LXrwBXLe8XejEYkkRfDBnMQ4ZOUc3tu/SteQCDoPeL8Q8PDBZBBjv4tMoY6v97+0HqFzztnvTi8QC18YtYf4cObG9DIzd/cStY2REwQQbEVBVb0GMWAKp6tiPWNFegreVS4pvcqXOQMuUS9QLlAlBbnQHqmaJoMgPUxEWKCpByDLbEW77G7z4nDkbOM4NHuElzOmQ0HlIrzYerGvQd57p/iDBxQbAigQYxkBM+B5t4XGxP8p40JXsGnZ0NZ8F8uMeum9we/8AlLcPjHZmWhxXGsPg2IdW/wBRqNabodVEPL49OHX7oczaeIU0r9c0NJn4tz4S0qiISNy3KtfqSBuibTwimtfrmgRMvg+PVOIAB4L8q0QwCXi3ud+SCLW7OprOlEbOZ2ml5dPsiHM+0tpOlUEmchufCWtUEvzg4FCllh/0+qEENptPDKWvH6ujaZfBKfPryREIO5flSiGkASdvc6nlVAZdnW86cEbOf6nnLpzShgj2ltJ1QQZzG58Ja0QP2nKXnf7JbSf6cuU+nLyTiV9n5yp0+aCRKQ3/AIz1r6oFm2dLzrwT2eTx35WuiHIe0vpOtEmAgzdu86jlRA9ntPFbSV0s+08NtePL5oiAk+C3KlU4hB9nflSn1JAbTL+nKek+vLzRLZ1vPyQ0iUnb/wAZ6V9FiY/tCHh2GJiHSb7oPiLj/K0alBkxJAGM5wAAzGdAAOLjbqufd6u/Zf8Ap4XwgUMXU/8Axgin+o14AUK0XebvPFxbstWQQZthg8LF/E8rD4nRIE4zJJJJJmSakk3JOpSkpKjExw0C5JIDWtBLnONA1rRUk8AqMXFt2c4jSG6uBo13XgeYV+FwUSK6RBYJCbTQtmAf1SKtMjSG2TjOZMMFubHwGIhuxAbFiNDmguJDgWQiLMY6zotaxLNkQzxSeNl2n3mgwWZYJa9wtLdbzJ1P0VAdqYWBh4Zccub3QWMObkZjMW9XT5rW9utgh0J0FuQRcJCjRIfuwojwJZeExWXAg6rSRYj4ri+Kcx4OqB/qGv8Ap9ZChhGjPJJJmSZuJnNx4k1mf8IJPeqi5QLzwUdoEEyVElKaRQOaJqJKU0E5qQKqmmCgtBU2uVQKmEF7HK+G9YrVe1B1/wDCvvSYjRgIrqgTgON8ramFzkBMcgRoF0babPwynrw5fJfNPZeMfCisiw552Pa5stSDMCnG0ua+l4REvHfnWn1NAbPZ+K+nD6sjZ5vHbl05pQwQfHbnWqHAkzbu8qDnRA820paVeKW0l+nLlPry804kj7O+sqUQCJSO/wDGelUB+S/q+H/KFXkic/X/AJTQTczZ+IV0r9ckCHmGc3/ZKG0tM3WtxqhzSTmG7+16IBjtpQ0lWiM8js9LT1qnEOejPPRAcJZfet59UA/9O1Z8eX3RkkNpreWlfuiH4N/W2vVINIOY7t/I2ogbW7SppKlEmxM5yG37IiDPVlvRSe4OGVu96daoIuibPwiutU3M2fiFdK+vyThuDRJ1/VaXt/txuDZmfJz3A7Nk7mniPBo1KCzt/tqFhoe1iGbzuQwavI/wLTOnWQXKO2+2IuJiGJFdM1DWjdYP5Wj/ADxkqe0+0YkeI6LEdNx8gBo1o0A4fNYaoaYCYCqjxwOuiCntDHNhNzOvoNSVoouMfEIZBDnxHiTnNBnJwrBgi7WaOeZF9qNmHX4jACI7M9zyTwkABwAOlfgVhReznwyHw4kiKgh2RzdZgzp1mFB77sP8KA+DPERXsiGsoeWTBwdmBn8F5Dtrs/CwIhZh4r42UydFdlDZi7YIA8RGsQmQ0E6q096ce6C6DGxMQw3CRaQ3M4C42gGfKbGtbcVpXvn9W5BA3v8ATQcFWSkSkgEFOSCgrLUjNTKrJQE0poSAQNSahjZrJgQC4hrWkk2ABJPQBBW1quYzTVbsdisggOxkYQp1ENviiu8hPL1r5K9nbuzYXYPCthsEgYsQZ3mZAlMUaZm0z0Wvh289bfO36w8bF6dL9cqb69rqez+6+Ki1EPKOMQ5B6GvwW0h914DP/MY+Cz+lpE/Un5LzON7SjRvaxXv5Eyb/ALRJvwWK0Ji4dMqXMHGrnK3tT7e/7P7S7LwbhEhiJiYratJFAdCCQGjqASuw9hRTiMNBjP8AC58KG4gWBcwOIE/9S+ZsLAc97WN3nuDW83OIDR6kL6fgYWTGMh7rGNYNN0SHwkuJSxaNIQw0zuubE2nhNNafXNBiZTkFv3Uojg4Sbf0ohjgBldvfvaq5dk5uzqKzpVGSY2mt5aU+yUMZKvtpqgtJOYbt/IXogX5w8AhW/mGfQQgrhvLzJ1r0+uaHPLTkFv3TiP2nhF71+uaGvyjIb8rVQERuzq3XimGTGfW/KijDbs6nXggsmdppfnRA4f6m9paXP7JB5JyaW50+yIn6m7px59OiZfMbPW3Kn2QKI7Z0brWqk9gaMwv+6UN2zoda0Wv7W7RZhIZjxCJVDWg1e42aPmdACUFPeHtuHh4W1iVeZiGwGWYj/AE6n5kLkfanaMSPEdFiOzOd6AaNaNAOCl212tExEV0WIZk2GjW6NaNAP3NySsBA1NoSaFXisQGi4mbVAn6qiGLxEvCLn6pad9DNYTnATJNbnWV70nPqD1VTYhmeM7WmbklpMjfRa/H4mdNB1vxrUdFA8XjyZyMh8fMrAa7MZmw049eSpiPmrGUCC2I+d1WhMBAAJgKQamUEFEqRKrcUCcVAlBKJSv6fugAPRMCdrJtZOpUmkkhrASTQACZJ4AC6DIwEKHnG1eWM95wbmNrSHG09FvsJj4j5wuz4GybZ0Z0i8/6nmjOgmeElpMf2bEg5REkHPbmyzmW1IkdJ0RhO0Y0OGYTH5WF2YyoZkASBuBQLuM6xpyZz4UZ1vLn00217t83szC4cl+IibeLcicxP+qZr/cfJYvbHbpjNENrQ2GCDIC8rDp5DRaQDzUprhommFAFX4eEXODWgkkgNAqSSZAAakkgIPb/hH2Ht8aIjh4IAznm8zEMf5d/YOK7hEeWUba9frktB3J7BGEwjcP8AxXHPGOhiGUwDqGgBo4ynqvQQ37PwnrT65IHEYGDM29qoYwOGc3/ZRhw9mcxtan1yQ6HmOcW53ogIbtpR2laILyDk0tzr904jtpQaVqgPkNnrblX7oJ/lG80Kn8m7l8f2QgnEaG1Zf1om1oIzO3vTpRRbD2fiNdPr0QYebx/DogIZzb9tJ0QXGeX3LeXVNztpQUlVG0kNn5T6oCJ4dzW8q9PmgtAGYb9/PWiG/p3rP5fdIQ5fqaXl1+6CrE4ljIbosc5WsEyTSnADUk0A1JXHe83bz8VFzumGikNv8rf3NJn5AL2n4qPccNDe2eURg146scGuPKdP7guYhAwrGhJrVHE4hrGlzjID6lLUoI47GNhML3GgtzPALzsPGufmiON6AToGjQZvC6/VX9qdoOhuIBIxFiQf/KtP8JhH8Y++4bu4K5pbXsfu/FxUMk5WxDXMBlDzUziNaMpP9QAcdSUGliRcrZU6UvzaR8QtTEfO1lte18C+FEdBiFoMMyfkeHCcpho4GRqDbUaHXu6SQVNaphOSkAgAFYGoa1SQJQcVJxVL3IE9yqJmi6AJ0FkAOV/qymGgVKm1slZgWM2gMVpdDB8YaZGUqeXnogu7L7Ki4l0mCTRvOO6P/wBHkPgtu7HwMICzDARYtnRXVA4gfsKcSVhdq9uOijZQxsoAEgxtC4f1SsOQ+K1M5IL4+Ie9xdEcXONyf8dKqvMqi9LMgtzKQVbSsnBYV8V7YcNjnvcZNa0Fzj0AQKG1dY/Cruk4ZcdFYf8A27SOIrGI6Ub5n+Uq3uT+GQY4RMaA5/uwRItaeMU2ef6R4eJdp1EO2dDWaAc0AZm73r1oiG0Oq+/OlEhDy+P4dfuhzNp4hTT69UBDcXGT7elUOcQZN3fXrVN0TaeEU1+vVAiZfBfn1QEQBu5fWVUBolmO/fz0ok1uzqazojZz/U0vLp9kENtE5+ias/OjgUIIw5z8dufFDpz8O7ytzT2m08NteP1dG0y+CU+fVARJfw76yQJSrv8AxnojLs63nTgjZz/U85dOaAh/+p5T+PySE513PhLT5J+05S87/ZLaT/T8p9OXkgwO8XZgxOHiQG2ewiYqGvFWO8nBp8lw9jCJhwk5pLXD+VzTJzT0IK+gC7Z0vOvBcx/E3sIwIn5xgnDiyEaQ3IkqP6OAkeY5oPHxIgaCSZACZK0XaXaJYQ+0WjoLf+i0iYjvH/VcDNg90EOuWqXaHaYo+QIvBYRMRHAkbaIDeG0gyb77hKzXLUYHCvxEbLMuc9xLnGpJJmXE6kkoNp3R7DdiIgMvCCvd95u224GGMPAIEctBc4V2DCKOlq8+63+40AnLE4hnZWGa1oa7ERAdm02ErxYn9Df/ALGQGpHMsXiXPcXOcXFzi5znXe43e7ny0EgqiEWJP43MzUzJJNyTUnVVpKQCigBWNahoUwgFFxTJVEWIgIkRUHiUE8VJjJ1KBNbPorgEKLnoJEqDnKDnqE0Ey9RmkhAJtuBqTIcyaABeu7pfhzjcdJ4bsYBrtYgPiHGGyhf1o3muydz+4mDwdYbM0YCsaJJz+BDBaGP9PmSg5d3S/C3FYnLExE8NBNfEP1XClmHc1q+oluldj7C7t4bBMy4SGATvv3oj+Gd5rK9KAaALbbSX6flPry80/Z85+VvugKS/r+M0Q/8A1L6TRs/4nnL/AJRLaVtLzQJs5+Ld525IiT9y3Lj9SRtM3glLn05eSC/Z+G+vD6sgcSUvBflwTZKXi3ud+SWz2fivpw+rI2ebx25dEChz/iW0nxQZzpufCWqYdtKWlXiltJfp+U+vLzQWSh8vVCh+S/q+CEBEINGX5UohpAEnb3Op5VQ9mz8QrpX65IbDzDOb/sgUMS9pbSdUEGcxufCWtEMdtKGkq0QXyOz0tPWqAiV9n5yp0+aZIlIb/wAZ619UP/TtWfHl90FkhtNby0r90BDkPaX0nWixsZgxFY+HFBMN7SDXjYjgRQg6SWSxu0qaSpRJsTOcht+yD5771dxIkF7xDEy02sIsM7kSHwMhlc02LeBE6+6Pa+FwTXujQ4pxAByNLJBztG5vdHMi3Fd77XwDIjdmQCRVrjcTuOYMhTkDcAj59/EvCiDjTDDmkNY2eUgycXOJB5yl9TQantXtR8eI6LEeHvefERQU3WMHusbYDzNSsElVgDWnMWVow5O64O+uCACm0Koh40+vJG2I0QZICCVjfmuXxSdHJ0QTixNFQT9fskSrGMQENimSoufJVOcgm56rJTDVY2EgrAUhDW37D7Bj4p+SBCc8jeNmstV7zRtDOU5nQFde7sfhRAgNEbFkR4lDsxMQW8iDWJ5yH9KDlPdruhicaf0YcmTkYr5thitfFKbjyaCeMl2Pun+GeFwhbEjtEeKJHNEAyNdQgw4VQKiYLsxGhC9rAgNc0SAaG+EBoAAAsANLptiZ/CaDkgHgkzbPLyMutE4kj7O+sqUSdEyHILc+ab27OorOlUACJSO/8Z6V9EodPaeU69fkmGTG01vLSn2Qz9S9JcOf2QIAzn7nwl0REE/Z21lRG0rs9LT1Q92zoKz4oG4giTd/lQ86ohkDfvzrT6mhzMozi/wr90MZtPEaaU+uaBQwQZvtzrVDgSZt3eVBzohkTaeE01p9c0OiZTkFv3QOJI+zvrKlEAiUjv8AxnpVD27OorOlUBkxtNby0p9kFezic/8Ad/ymj84eATQOG0sM3WtxqhzS45hu/teiIby8yda/16oc8tOQW/dA4hz0bpfRMPEsnvW8+qUQZKt14oDARn96/mEBD8G9rbW33SDSDnO7fyNqJw/HvaWlS/2SDyTk923kLf4QEQZ6tt6LS95u92FwjCIj5xAJ7Nom89dGjm4jzWJ3j79YTBTbtBEeLsZJxB4OdZvS/JcE7zdtfmo8WMGlpiPLiAZgD+WcpuAEhpYIPR96/wAT8TiAYcFxgwpncJD3C0nvv5NlfVeBksiDhXPcGsY57nAya1pc4yE6AVK6B3X/AAmxMch2IcMOzwukQHRHNlUZQZMNZeKo4UQeCwUSoBHT1sfr/jNjYBvD0ovoHsDubg8EQ2FBDnSymLEAfEIdfxSAb0aAFj9v/h7g4niY10JxvsyMp6sIIH9skHATh3Czz0Nf8qBbE/pPlL/El1XH/hVHAzQo0J4vJ4dDPlLMCfMLz2K7h45s/wDwznAasLX+gaZ/BB4g5/8Apt9T+6iZ6w/it/iex40PfgxWf6ob2/8AcFg7McQg1ZgzE5SOvPmqnOIoVuDBVGIws0GrVrISycJgnPeIbGOc82a0Fzj0aKldK7sfhTEeWuxjjCbMfpMIMQ23nVazoMxr7pQc87L7Kix3iFBhuiPNmtEz1OjRzMgupd1vwnaJOxr5u0gwyQJ8IkQVPRsupXSezuyYODYIeGhNY03kJkkaucauPMklZuQSz+9fzQUdnYWHh2CG1jWMG61gAA8grWtIOY7t/W1PNOGM+9paVEmvJOQ2t6W/wgIjS+rbW4VUojw4Sbf0UYjiyjbX+vRSiMDBmbdAMeGjK6/qow2llXWtxUmMDhmN/wBlGG7PR1hWlEA5pJzjdv5C9PJOJ493S+iTnkHIN23kb/5TieDd1vOtvugeYSye9bz6pQzk3tbap5BLP71/NKGM9XacECa0g5ju/vaiIjS+rbW4V+ihry45Db9kRHllG2v9eiCUR4eJNvfghjw0ZTf97IiMDBNt7IYwOGY3/ZBGGMlXfugtJOcbt/IXoiG7PR2nCiC8g5Pdt5FBZ+ZZ9BCPyrefqhBB79p4R1r9c0NflGQ35WqiIA2rL8q0Q1oIm7e9OlECht2dTrwRsyTtNL86IhnNv20nRaTvuX/kMY2GCf8Aw0YNkJzJhukBSZqg13ez8QsHh6Z9rEE/AwggHg59QLVAmRwXKO8v4j4zF/psds4Zk0MZMZp0AJ3nk2lY8Fl92/wsxeIlExH6EM18QzRSOUP3P7iCOBXW+7fc3B4FodAhzjSrFeQ+KZymJ2baoaAOSDkHd38McZicr8TPDwzXxicQj+mFMZf7ssuBXSYf4Xdnsg5Cx5sdrnO1JlK8soHICXJe0hgO376TpRJhJMnbvp0qg1XYfdnDYZgGGhNYBQuNXu45nmZOlJy5LbPftPCOtfT5pRCQZMtyrXqnEAbVl+VafUkA1+UZDe3Kv3ShjZ1OvBNrQRN296HlRKH4t/ynRAbOu00vzREG0tpx59OiJmeX3PhLqiJ4dzzlXogZiTGzF7cqX/wseNhIUssWEx861Y13/csggAZhv/GZvT1RDAdV99J0og08Xungt5+EgEf0w2g16AKlncvAnxNwsIDgZn4EkLesJJk7d506VQ8kGTN3lXrVBjYPAQGDLAgw4WpysayY55brKa+Q2ZvblX7oiANqy+sq0Q1oIzHf+M9KeiBQxs768EbOu00vzRD8W/5ToiZnl9z4S6oCINpbTim5+YZBe3Kn2SieHc85VTc0ATG/8Z609UAx+zoetPrkkyHkOY25JwwHCb786U+ppMJJk+3OnxQDoec5hbneicR20oNK1SeSDJu7yr1qnEAbuX1lWiAD5DZ625V+6UP9O+vDl16phoIzHf8AjPSnolD8W/5Tp1QGzrtNL80RBtKjTigEzy+58JdURDl3Layqgbn5hkF/hT7IY/Z+E9afXJDmgCbd7160RDAcJvvzpT6mgTIezOY9KfXJDoeY5xbneiIZLjJ9udKocSDJu769aoHEdtKDStUB8hs9bcq/dEQBu5fWVaIDRLMd/wCM9KIIfk3cR8f2QltYnP8A2/8ACaAwO95fMJYj2nomhBZj7DqpM9n5FCEEMBr5fNVw/aeZ+aaEDx9x0VuK3PRCEBgt3zKpwO95fMIQgUf2nmPkrcfYIQgkPZ+ShgNfL5oQghC9p5u+aMdcdE0ILcXueiMJueqEIKcDvHp8wlF9p5t+SaEE8fp5qf8AD/tQhBHAWKqg+08z800IDHb3l8yrsZu+YQhAYXc9VTgLnomhBGL7Tzb8lZj9PP5IQgm72fkFHAWPVCEFUD2nmfmnjt7y+ZQhBdjd3zRhtz1QhBVgLnoov9p5j5JoQZyEIQf/2Q==" alt=""  /></div>
              <div className="">
                {" "}
                <button
                  className={`grap ${lodingRoll ? "__disabled" : ""}`}
                  onClick={() => rollAll()}
                  disabled={lodingRoll}
                >
                <span className="product__start">Start</span>  
                </button>
              </div>
              <div className=""><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWp6jYaP71CWbS_4GYQhPoGPEQ5ceeVWVIHA&s" alt=""  /></div>
            </div>
            <div className="list__ofproduct">
              <div className=""><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHrYIkmYK8qsrdPMhYpInT_XNcTBcXTp2EOg&s" alt=""  /></div>
              <div className=""><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRterG707j3s5TCme2DaKEWzuAU1sr678oZGg&s" alt=""  /></div>
              <div className=""><img src="data:image/jpeg;base64,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" alt=""  /></div>
            </div>
          </div>

          <div style={{ paddingTop: 10 }}>
            <span className="exclusive__chaneels">
              Exclusive channel for exclsuive members
            </span>
          </div>
        </div>

        <div className="button__grap"></div>

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
              <div className="comission__value">
                {Amount.Dollar(record?.balance)}
              </div>
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
              (1) Every members from this room be able to grap{" "}
              {record?.vip?.dailyorder} orders per day
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
