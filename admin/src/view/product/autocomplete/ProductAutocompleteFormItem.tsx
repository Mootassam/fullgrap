import React, { useState } from 'react';
import CouponsService from 'src/modules/product/productService';
import CouponsFormModal from 'src/view/product/form/ProductFormModal';
import AutocompleteInMemoryFormItem from 'src/view/shared/form/items/AutocompleteInMemoryFormItem';
import { useFormContext } from 'react-hook-form';
import { useSelector } from 'react-redux';
import selectors from 'src/modules/product/productSelectors';

function ProductAutocompleteFormItem(props) {
  const { setValue, getValues } = useFormContext();

  const [modalVisible, setModalVisible] = useState(false);

  const hasPermissionToCreate = useSelector(
    selectors.selectPermissionToCreate,
  );

  const doCloseModal = () => {
    setModalVisible(false);
  };

  const doOpenModal = () => {
    setModalVisible(true);
  };

  const doCreateSuccess = (record) => {
    const { name, mode, controlledOnChange } = props;

    if (controlledOnChange) {
      // Controlled mode (used inside a RHF Controller / useFieldArray)
      const newValue = record
        ? { id: record.id || record._id, label: record.label || record.title }
        : null;
      controlledOnChange(newValue);
    } else if (mode && mode === 'multiple') {
      setValue(
        name,
        [...(getValues()[name] || []), record],
        { shouldValidate: true, shouldDirty: true },
      );
    } else {
      setValue(name, record, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    doCloseModal();
  };

  const fetchFn = (value, limit) => {
    return CouponsService.listAutocomplete(value, limit);
  };

  const mapper = {
  toAutocomplete(originalValue) {
    if (!originalValue) return null;
    return {
      key: originalValue.id || originalValue._id?.toString(),
      value: originalValue.id || originalValue._id?.toString(),
      label: originalValue.label || originalValue.title,   // fallback to title
    };
  },
  toValue(originalValue) {
    if (!originalValue) return null;
    return {
      id: originalValue.value || originalValue.id,
      label: originalValue.label,   // keep label as stored
    };
  },
};
  return (
    <>
      <AutocompleteInMemoryFormItem
        {...props}
        fetchFn={fetchFn}
        mapper={mapper}
        onOpenModal={doOpenModal}
        hasPermissionToCreate={hasPermissionToCreate}
      />

      {modalVisible && (
        <CouponsFormModal
          onClose={doCloseModal}
          onSuccess={doCreateSuccess}
        />
      )}
    </>
  );
}

export default ProductAutocompleteFormItem;
