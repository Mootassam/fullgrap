import React from 'react';
import Header from 'src/view/layout/Header';
import Menu from 'src/view/layout/Menu';
import { useRouteMatch } from 'react-router-dom';
import LayoutWrapper from 'src/view/layout/styles/LayoutWrapper';
import { useSelector } from 'react-redux';
import userSelectors from 'src/modules/user/userSelectors';

function Layout(props) {
  const match = useRouteMatch();
  const hasPermissionToEdit = useSelector(
    userSelectors.selectPermissionToEdit,
  );

  return (
    <LayoutWrapper>
        {hasPermissionToEdit && (  <Menu url={match.url} /> ) }
      <div className="main">
        <Header />
        <div className="content">{props.children}</div>
      </div>
    </LayoutWrapper>
  );
}

export default Layout;
