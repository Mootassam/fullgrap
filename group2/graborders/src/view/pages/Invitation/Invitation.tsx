import React, { useRef } from "react";
import SubHeader from "src/view/shared/Header/SubHeader";
import authSelectors from "src/modules/auth/authSelectors";
import { useSelector } from "react-redux";
import Message from "src/view/shared/message";

function Invitation() {
  const currentUser = useSelector(authSelectors.selectCurrentUser);
  const referenceCodeRef = useRef<any>(null);
  const copyToClipboard = () => {
    const referenceCode = referenceCodeRef.current.innerText;

    // Check if the browser supports the modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(referenceCode)
        .then(() => {
          alert("Copied to clipboard:")
          // You can add any additional logic here, such as showing a success message
        })
        .catch((error) => {
          console.error('Error copying to clipboard:', error);
          // You can handle errors here, such as displaying an error message to the user
        });
    } else {
      // Fallback for browsers that do not support the modern clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = referenceCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      Message.success("Copied")

      // You can add any additional logic here for the fallback mechanism
    }
  };

  return (
    <div className="app__invitation">
      <SubHeader title="Invitation" path="/" />

      <div className="invitation__absolute"></div>
      <div className="invitation__content">
        <div className="invitation__logo">
          <img
            src="/images/invitation/logo.png"
            alt=""
            className="invitation__"
          />
        </div>
        <div className="invitation__details">
      <span>My Referral Code</span>
      <span
        className="reference__code"
        ref={referenceCodeRef}
        style={{ cursor: "pointer" }}
      >
        {currentUser?.invitationcode}
      </span>
      <div className="invitation__button" onClick={copyToClipboard}>Copy referral Code</div>
    </div>
      </div>
    </div>
  );
}
export default Invitation;
