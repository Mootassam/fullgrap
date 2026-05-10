import { useForm, FormProvider } from 'react-hook-form';
import { i18n } from 'src/i18n';
import React, { useState } from 'react';
import InputFormItem from 'src/view/shared/form/items/InputFormItem';
import SelectFormItem from 'src/view/shared/form/items/SelectFormItem';
import InputNumberFormItem from 'src/view/shared/form/items/InputNumberFormItem';
import TagsFormItem from 'src/view/shared/form/items/TagsFormItem';
import FormWrapper from 'src/view/shared/styles/FormWrapper';
import ButtonIcon from 'src/view/shared/ButtonIcon';
import * as yup from 'yup';
import yupFormSchemas from 'src/modules/shared/yup/yupFormSchemas';
import userEnumerators from 'src/modules/user/userEnumerators';
import { yupResolver } from '@hookform/resolvers/yup';
import VipAutocompleteFormItem from 'src/view/vip/autocomplete/VipAutocompleteFormItem';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Errors from 'src/modules/shared/error/errors';

const schema = yup.object().shape({
  email: yupFormSchemas.email(i18n('user.fields.email')).required(),
  password: yupFormSchemas.string(i18n('user.fields.password')).required().min(6),
  fullName: yupFormSchemas.string(i18n('fullName')).required(),
  vip: yupFormSchemas.relationToOne(i18n('user.fields.vip')),
  balance: yupFormSchemas.decimal(i18n('user.fields.balance'), {
    required: false,
    min: 0,
  }),
  invitationcode: yupFormSchemas.string(i18n('user.fields.invitationcode'), {
    required: false,
  }),
  status: yupFormSchemas.enumerator(i18n('user.fields.status'), {
    options: userEnumerators.status,
  }),
});

function UserCreateDirectForm(props) {
  const { saveLoading } = props;
  const [submitError, setSubmitError] = useState(null);

  const [initialValues] = useState(() => ({
    email: '',
    password: '',
    fullName: '',
    vip: null,
    balance: 0,
    invitationcode: '',
    status: 'active',
  }));

  const form = useForm({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
    defaultValues: initialValues,
  });

  const onSubmit = (values) => {
    setSubmitError(null);
    try {
      const { ...data } = values;
      data.balance = parseFloat(data.balance) || 0;

      // ---- FIX: ensure parent provided a valid submit handler ----
      if (typeof props.onSubmit !== 'function') {
        console.error(
          'UserCreateDirectForm: props.onSubmit is not a function. ' +
          'Please pass a submit handler as a prop.'
        );
        setSubmitError(
          i18n('user.createDirect.error') || 'Error creating user. (onSubmit prop missing)'
        );
        return;
      }

      props.onSubmit(null, data);
    } catch (error) {
      // Show any runtime error to the user
      Errors.handle(error);
      setSubmitError(
        i18n('user.createDirect.error') || 'Error creating user'
      );
    }
  };

  const onReset = () => {
    setSubmitError(null);
    Object.keys(initialValues).forEach((key) => {
      form.setValue(key as keyof typeof initialValues, initialValues[key]);
    });
  };

  return (
    <FormWrapper>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {submitError && (
            <div className="alert alert-danger">
              {submitError}
            </div>
          )}
          <Row>
            <Col sm={6}>
              <InputFormItem
                name="email"
                label={i18n('user.fields.email')}
                required={true}
              />
            </Col>
            <Col sm={6}>
              <InputFormItem
                name="password"
                label={i18n('user.fields.password')}
                type="password"
                required={true}
              />
            </Col>
          </Row>

          <Row>
            <Col sm={6}>
              <InputFormItem
                name="fullName"
                label={i18n('user.fields.fullName')}
                required={true}
              />
            </Col>
            <Col sm={6}>
              <InputNumberFormItem
                name="balance"
                label={i18n('user.fields.balance')}
              />
            </Col>
          </Row>

          <Row>
            <Col sm={6}>
              <VipAutocompleteFormItem
                name="vip"
                label={i18n('user.fields.vip')}
                required={false}
              />
            </Col>
            <Col sm={6}>
              <InputFormItem
                name="invitationcode"
                label={i18n('user.fields.invitationcode')}
              />
            </Col>
          </Row>

          {/* <Row>
            <Col sm={6}>
              <SelectFormItem
                name="status"
                label={i18n('user.fields.status')}
                options={userEnumerators.status.map((value) => ({
                  value,
                  label: i18n(`user.status.${value}`),
                }))}
                required={true}
              />
            </Col>
          </Row> */}

          <div className="form-buttons">
            <button
              className="btn btn-primary"
              disabled={saveLoading}
              type="submit"
            >
              <ButtonIcon
                loading={saveLoading}
                iconClass="far fa-save"
              />
              {i18n('common.save')}
            </button>

            <button
              disabled={saveLoading}
              onClick={onReset}
              className="btn btn-light"
              type="button"
            >
              <i className="fas fa-undo"></i>
              {i18n('common.reset')}
            </button>

            {props.onCancel ? (
              <button
                disabled={saveLoading}
                onClick={() => props.onCancel()}
                className="btn btn-light"
                type="button"
              >
                <i className="fas fa-times"></i>
                {i18n('common.cancel')}
              </button>
            ) : null}
          </div>
        </form>
      </FormProvider>
    </FormWrapper>
  );
}

export default UserCreateDirectForm;