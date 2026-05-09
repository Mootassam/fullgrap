import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import authSelectors from "src/modules/auth/authSelectors";
import actions from "src/modules/product/list/productListActions";
import selector from "src/modules/product/list/productListSelectors";
import recordListAction from "src/modules/record/list/recordListActions";
import recordSelector from "src/modules/record/list/recordListSelectors";
import recordActions from "src/modules/record/form/recordFormActions";

import LoadingModal from "src/shared/LoadingModal";
import Dates from "src/view/shared/utils/Dates";
import Image from "src/shared/Images";
import GrapModal from "./GrapModal";
import PrizeModal from "./PrizeModal";
import { i18n } from "../../../i18n";
import Message from "src/view/shared/message";

const Grappage = () => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const dispatch = useDispatch();

  const currentUser = useSelector(authSelectors.selectCurrentUser);
  const items = useSelector(selector.selectRows);
  const loading = useSelector(selector.selectLoading);
  const showModal = useSelector(selector.showModal);
  const totalperday = useSelector(recordSelector.selectTotalPerday);

  const [number] = useState(Dates.Number());

  // Initialize random images
  const initializeImages = async () => {
    try {
      const initialImages = await Promise.all(
        Array(12).fill(0).map(() => Image.randomImages())
      );
      setImages(initialImages);
      setIsInitialized(true);
    } catch (error) {
      console.error("Error loading images:", error);
      const fallback = "https://plus.unsplash.com/premium_photo-1664392147011-2a720f214e01?q=80&w=878&auto=format&fit=crop";
      setImages(Array(12).fill(fallback));
      setIsInitialized(true);
    }
  };

  // Get visible images (Left, Center, Right)
  const getVisibleImages = useCallback(() => {
    if (images.length === 0) return [];
    return [
      images[(currentIndex - 1 + images.length) % images.length],
      images[currentIndex % images.length],
      images[(currentIndex + 1) % images.length],
    ];
  }, [images, currentIndex]);

  const visibleImages = getVisibleImages();

  // Smooth next slide
  const slideToNext = useCallback(() => {
    if (isAnimating || !isInitialized || images.length === 0) return;

    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setTimeout(() => setIsAnimating(false), 700);
    }, 30);
  }, [isAnimating, isInitialized, images.length]);

  // Initialize data
  useEffect(() => {
    dispatch(recordListAction.doCount());
    dispatch(recordListAction.doCountDay());
    initializeImages();
  }, [dispatch]);

  // Auto-play slider
  useEffect(() => {
    if (!isInitialized) return;
    const interval = setInterval(slideToNext, 3200);
    return () => clearInterval(interval);
  }, [isInitialized, slideToNext]);

  // Balance and task warnings
  useEffect(() => {
    if (currentUser?.balance <= 0) {
      Message.error("Insufficient balance. Please top up your account to continue.");
    }
    if (currentUser?.tasksDone >= currentUser?.vip?.dailyorder) {
      Message.success("You have completed all available tasks. Please contact support to reset your account.");
    }
  }, [currentUser]);

   const rollAll = async () => {
     if (currentUser?.balance <= 0) {
       Message.error("Insufficient balance. Please top up your account to continue.");
       return;
     }
     if (currentUser?.tasksDone >= currentUser?.vip?.dailyorder) {
       Message.success("You have completed all available tasks. Please contact support to reset your account.");
       return;
     }

     // The server's grapOrders() endpoint already inspects productItemMappings
     // and returns the correct product for the current task position.
     // We just trigger the fetch — no extra filter needed from the client side.
     await dispatch(actions.doFetch());
   };

  const hideModal = () => {
    dispatch(actions.doCloseModal());
  };

  const submit = async () => {
    const values = {
      number,
      product: items?.id,
      price: items?.amount,
      commission: items?.commission,
      status: items?.type === "combo" ? "pending" : "completed",
      user: currentUser.id,
    };
    await dispatch(recordActions.doCreate(values));
  };

  return (
    <div className="grappage-container">
      {/* Header */}
      <div className="grappage-header">
        <div className="user-greeting">
          <div className="greeting-content">
            <img src="/images/user.png" alt="User" className="user-avatar" />
            <span className="greeting-text">
              {i18n("pages.grab.greeting", currentUser.fullName)}
            </span>
          </div>
          <div className="vip-badge">{currentUser.vip?.title}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon">
              <img src="/images/wallet.png" alt="Wallet" />
            </div>
            <div className="stat-info">
              <div className="stat-title">{i18n("pages.grab.totalAmount")}</div>
              <div className="stat-subtitle">{i18n("pages.grab.profitsAdded")}</div>
            </div>
          </div>
          <div className="stat-amount">
            <div className="amount-value">{currentUser.balance?.toFixed(2) || "0.00"}</div>
            <div className="amount-currency">{i18n("pages.grab.currency")}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon">
              <img src="/images/T.png" alt="Commission" />
            </div>
            <div className="stat-info">
              <div className="stat-title">{i18n("pages.grab.todaysCommission")}</div>
              <div className="stat-subtitle">{i18n("pages.grab.commissionEarned")}</div>
            </div>
          </div>
          <div className="stat-amount">
            <div className="amount-value">{totalperday || "0.00"}</div>
            <div className="amount-currency">{i18n("pages.grab.currency")}</div>
          </div>
        </div>
      </div>

      {/* Optimization Header */}
      <div className="optimization-section">
        <div className="optimization-header">
          <span>{i18n("pages.grab.startOptimization")}</span>
          <span className="progress-count">
            {i18n("pages.grab.progressCount", currentUser?.tasksDone || 0, currentUser?.vip?.dailyorder || 0)}
          </span>
        </div>
      </div>

      {/* Main Game Section */}
      <div className="game-grid-section">
        <div className="game-header">
          <div className="vip-info">
            <div className="vip-title">{currentUser?.vip?.title}</div>
            <div className="commission-rate">
              <span className="rate-label">{i18n("pages.grab.commissionRate")}: </span>
              <span className="rate-value">{currentUser?.vip?.comisionrate}%</span>
            </div>
          </div>
          <div className="channel-info">
            <span>{i18n("pages.grab.exclusiveChannel")}</span>
          </div>
        </div>

        {/* Enhanced Slider */}
        <div className="slider-container">
          <div className="slider-wrapper">
            <div className={`slider-track ${isAnimating ? "sliding" : ""}`}>
              {visibleImages.map((src, index) => (
                <div
                  key={`slide-${currentIndex}-${index}`}
                  className={`slider-item ${index === 1 ? "active" : ""}`}
                  data-position={index}
                >
                  <div className="image-container">
                    <img
                      src={src}
                      alt={`Product ${index + 1}`}
                      className="slider-image"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="game-grid">
            <button
              className={`start-button ${loading ? "loading" : ""}`}
              onClick={rollAll}
              disabled={loading}
            >
              <span className="button-text">
                {loading ? i18n("pages.grab.processing") : i18n("pages.grab.startButton")}
              </span>
            </button>
          </div>
        </div>

        <div className="channel-footer">
          <span>{i18n("pages.grab.exclusiveChannel")}</span>
        </div>
      </div>

      {/* Notice */}
      <div className="notice-section">
        <div className="notice-header">
          <b>{i18n("pages.grab.notice")}:</b>
        </div>
        <ul className="notice-list">
          <li>{i18n("pages.grab.supportHours")}</li>
          <li>{i18n("pages.grab.contactSupport")}</li>
        </ul>
      </div>

      {/* Modals */}
      {loading && <LoadingModal />}
      {items && items.type === "prizes" && showModal && !loading && (
        <PrizeModal items={items} number={number} hideModal={hideModal} submit={submit} />
      )}
      {items && items.type !== "prizes" && showModal && !loading && (
        <GrapModal items={items} number={number} hideModal={hideModal} submit={submit} />
      )}

      {/* Professional CSS */}
      <style>{`
        .grappage-container {
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .grappage-header { margin-bottom: 24px; }
        .user-greeting {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 18px 24px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        .greeting-content {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 3px solid #e2e8f0;
        }
        .greeting-text {
          font-size: 17px;
          font-weight: 600;
          color: #1e2937;
        }
        .vip-badge {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          padding: 8px 20px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 15px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          padding: 22px;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.07);
          border: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stat-content { display: flex; align-items: center; gap: 16px; }
        .stat-icon {
          width: 56px;
          height: 56px;
          background: #f8fafc;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
        }
        .stat-icon img { width: 28px; height: 28px; }
        .stat-title { font-weight: 700; color: #1e2937; font-size: 15px; }
        .stat-subtitle { font-size: 13px; color: #64748b; }
        .amount-value {
          font-size: 22px;
          font-weight: 800;
          color: #3b82f6;
        }
        .amount-currency { font-size: 13px; color: #64748b; font-weight: 500; }

        .optimization-section {
          background: white;
          padding: 18px 24px;
          border-radius: 20px;
          margin-bottom: 28px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.07);
          border: 1px solid #e2e8f0;
        }
        .optimization-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 17px;
          font-weight: 700;
          color: #1e2937;
        }
        .progress-count {
          background: #22c55e;
          color: white;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 700;
        }

        .game-grid-section {
          background: white;
          padding: 28px 24px;
          border-radius: 24px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-bottom: 30px;
        }

        .game-header {
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .vip-title { font-size: 20px; font-weight: 800; color: #1e2937; }
        .rate-value { color: #3b82f6; font-weight: 700; }

        /* =============== PROFESSIONAL SLIDER =============== */
        .slider-container {
          margin: 20px 0 30px;
        }
        .slider-wrapper {
          position: relative;
          height: 280px;
          overflow: hidden;
          border-radius: 24px;
        }
        .slider-track {
          display: flex;
          height: 100%;
          transition: transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1);
          will-change: transform;
        }
        .slider-track.sliding {
          transition: transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .slider-item {
          flex: 0 0 33.333%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          transition: all 0.5s ease;
        }

        .slider-item[data-position="0"],
        .slider-item[data-position="2"] {
          transform: scale(0.78);
          opacity: 0.72;
          filter: brightness(0.95);
        }

        .slider-item[data-position="1"] {
          transform: scale(1.02);
          opacity: 1;
          z-index: 10;
        }

        .slider-item.active .image-container {
          border: 5px solid #3b82f6;
          box-shadow: 0 20px 50px rgba(59, 130, 246, 0.35);
        }

        .image-container {
          width: 100%;
          max-width: 260px;
          height: 260px;
          border-radius: 22px;
          overflow: hidden;
          border: 4px solid #e2e8f0;
          background: #f8fafc;
          transition: all 0.4s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .slider-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .slider-item.active .slider-image:hover {
          transform: scale(1.08);
        }

        .game-grid {
          display: flex;
          justify-content: center;
          margin-top: 30px;
        }

        .start-button {
          width: 300px;
          height: 68px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          border-radius: 20px;
          color: white;
          font-size: 19px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.35);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .start-button:hover:not(.loading) {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(34, 197, 94, 0.45);
        }

        .start-button.loading {
          background: linear-gradient(135deg, #94a3b8, #64748b);
          cursor: not-allowed;
        }

        .start-button.loading::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .channel-footer {
          text-align: center;
          color: #64748b;
          font-size: 14px;
          margin-top: 20px;
        }

        .notice-section {
          background: #fef2f2;
          padding: 20px 24px;
          border-radius: 16px;
          border: 1px solid #fecaca;
        }
        .notice-header { color: #ef4444; margin-bottom: 10px; }
        .notice-list { color: #64748b; line-height: 1.7; }

        /* Responsive */
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr; }
          .slider-wrapper { height: 240px; }
          .image-container { max-width: 220px; height: 220px; }
          .start-button { width: 260px; height: 62px; font-size: 17px; }
        }

        @media (max-width: 480px) {
          .slider-wrapper { height: 210px; }
          .image-container { max-width: 180px; height: 180px; }
          .start-button { width: 240px; height: 58px; }
        }
      `}</style>
    </div>
  );
};

export default Grappage;