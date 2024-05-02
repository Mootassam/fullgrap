import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import actions from "src/modules/auth/authActions";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import yupFormSchemas from "src/modules/shared/yup/yupFormSchemas";
import { i18n } from "../../../i18n";
import { yupResolver } from "@hookform/resolvers/yup";
import InputFormItem from "src/shared/form/InputFormItem";
import selectors from "src/modules/auth/authSelectors";
import ButtonIcon from "src/shared/ButtonIcon";
const schema = yup.object().shape({
  email: yupFormSchemas.string(i18n("user.fields.email"), {
    required: true,
  }),
  password: yupFormSchemas.string(i18n("user.fields.password"), {
    required: true,
  }),
  invitationcode: yupFormSchemas.string(i18n("user.fields.invitationcode"), {
    required: true,
  }),
  
  rememberMe: yupFormSchemas.boolean(i18n("user.fields.rememberMe")),
});
function Signup() {
  const dispatch = useDispatch();

  const loading = useSelector(selectors.selectLoading);

  const [initialValues] = useState({
    email: "",
    password: "",
    invitationcode:"",
    rememberMe: true,
  });

  useEffect(() => {
    dispatch(actions.doClearErrorMessage());
  }, [dispatch]);

  const form = useForm({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: initialValues,
  });

  const externalErrorMessage = useSelector(selectors.selectErrorMessage);

  const onSubmit = ({ email, password,  invitationcode}) => {
    dispatch(actions.doRegisterEmailAndPassword(email, password,invitationcode));
  };
  return (
    <div className="auth__page">
      <div className="login__page">
        <img src="/images/Login/login.png" alt="" />
      </div>

      <div className="auth__header header__signup ">
        <h1 className="auth__title"> Create Account</h1>
        <span className="auth__description __v2">
        Create an account so you can explore all the existing jobs
        </span>
      </div>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="auth__form">
   
              <InputFormItem
                type="text"
                name="email"
                placeholder={i18n("user.fields.email")}
                className="auth__input"
                externalErrorMessage={externalErrorMessage}
              />
         

              <InputFormItem
                type="text"
                name="password"
                placeholder={i18n("user.fields.password")}
                className="auth__input"
              />

              
<InputFormItem
                type="text"
                name="invitationcode"
                placeholder={i18n("user.fields.invitationcode")}
                className="auth__input"
              />
         
          </div>

          <div className="auth__bottom">
            <button className="auth__button" disabled={loading} type="submit">
              <ButtonIcon loading={loading} /> 
              <span>
              Sign up</span>
            </button>
            <Link to="/auth/signin" className="remove__ligne">
              <span className="auth__link">Already have an account</span>
            </Link>
          </div>
        </form>
      </FormProvider>

      <div className="bottom__image">
        <img
          src="/images/Login/bottom.png"
          alt="bottom__page"
          className="bottom__image"
        />
      </div>
    </div>
  );
}

export default Signup;
