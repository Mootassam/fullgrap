import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';
import { i18n } from 'src/i18n';
import actions from 'src/modules/vip/view/vipViewActions';
import selectors from 'src/modules/vip/view/vipViewSelectors';
import CouponsView from 'src/view/vip/view/VipView';
import CouponsViewToolbar from 'src/view/vip/view/VipViewToolbar';
import ContentWrapper from 'src/view/layout/styles/ContentWrapper';
import Breadcrumb from 'src/view/shared/Breadcrumb';
import PageTitle from 'src/view/shared/styles/PageTitle';

function CouponsPage() {
  const dispatch = useDispatch();
  const match = useRouteMatch();

  const loading = useSelector(selectors.selectLoading);
  const record = useSelector(selectors.selectRecord);

  useEffect(() => {
    dispatch(actions.doFind(match.params.id));
  }, [dispatch, match.params.id]);

  return (
    <>
      <Breadcrumb
        items={[
          [i18n('dashboard.menu'), '/'],
          [i18n('entities.vip.menu'), '/product'],
          [i18n('entities.vip.view.title')],
        ]}
      />

      <ContentWrapper>
        <PageTitle>
          {i18n('entities.vip.view.title')}
        </PageTitle>

        <CouponsViewToolbar match={match} />

        <CouponsView loading={loading} record={record} />
      </ContentWrapper>
    </>
  );
}

export default CouponsPage;
