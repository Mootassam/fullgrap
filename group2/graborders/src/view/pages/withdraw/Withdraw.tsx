import React, { useEffect, useState } from "react";
import SubHeader from "src/view/shared/Header/SubHeader";
import authSelectors from "src/modules/auth/authSelectors";
import yupFormSchemas from "src/modules/shared/yup/yupFormSchemas";
import * as yup from "yup";
import { i18n } from "../../../i18n";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import InputFormItem from "src/shared/form/InputFormItem";
import actions from "src/modules/transaction/form/transactionFormActions";
import authActions from "src/modules/auth/authActions";
const schema = yup.object().shape({
  amount: yupFormSchemas.integer(i18n("entities.transaction.fields.amount"), {
    required: true,
    min: 10,
  }),
});

function Withdraw() {
  const currentUser = useSelector(authSelectors.selectCurrentUser);
  const dispatch = useDispatch();
  useEffect(() => {
  
  }, [currentUser])
  const onSubmit = ({ amount }) => {
    const values = {
      status: "pending",
      date: new Date(),
      user: currentUser ? currentUser.id : null,
      type: "withdraw",
      amount: amount,
      vip : currentUser 
    };
    dispatch(authActions.doRefreshCurrentUser());
    dispatch(actions.doCreate(values));
  
  };

  const [initialValues] = useState({
    amount: "",
  });
  const form = useForm({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: initialValues,
  });


  
  return (
    <div>
      <SubHeader title="WithDraw" path="/" />
      <div className="withdraw__page">
        <div className="withdraw__content">
          <div className="withdraw__header">
            <h3 className="hall" style={{ paddingTop: 0 }}>
              Withdraw Amount:
            </h3>

            <span style={{ color: "black", fontSize: "14px" }}>
              Availabe balance : {currentUser.balance} Usdt
            </span>
          </div>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div>
                <InputFormItem
                  type="text"
                  name="amount"
                  placeholder={i18n("entities.transaction.fields.amount")}
                  className="input__withdraw"
                />
                <div className="number__click">
                  <div className="withdraw__">
                    <div> 30 </div>
                    <div>50</div>
                    <div>100</div>
                    <div>300</div>
                  </div>
                  <div className="withdraw__">
                    <div>500</div>
                    <div>1000</div>
                    <div>3000</div>
                    <div>5000</div>
                  </div>
                </div>
                <button className="confirm" type="submit">
                  Confirm
                </button>
              </div>
            </form>
          </FormProvider>
        </div>

        <div className="withdraw__rules">
          <div className="rules__title">Rules Description</div>

          <ul className="rules__list">
            <li>
              (1) The amount of single withdraw is between 20 ~ 100000000{" "}
            </li>
            <li>
              (2) the payment shall be made within 72 hours after the withdraw
              application is approved, and the actual time shall be subject to
              the system. The bank will charge a fee for each withdrawal, and
              the minumun withdraw amount is 20.
            </li>
            <li>
              (3) Every accounts must complete a minumun purchaes order of 50 in
              order to whithdraw the money . if the member has not completed the
              corresponding order number. he/she cannot make a withdrawl. The
              member can make a full withdrawl if the account has completed more
              than 50 orders{" "}
            </li>
            <li>(4) withdraw time is 16:00-15:59</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Withdraw;
