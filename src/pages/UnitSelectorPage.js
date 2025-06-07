import React, { useState } from "react";
import UnitSelector from "../components/UnitSelector";
import RaiseRequestForm from "../components/RaiseRequestForm";

function UnitSelectorPage({ userId }) {
  const [selectedUnit, setSelectedUnit] = useState("");

  const handleUnitChange = (unit) => {
    setSelectedUnit(unit);
  };

  return (
    <div>
      <h1>Select Your Unit</h1>
      {!selectedUnit ? (
        <UnitSelector selectedUnit={selectedUnit} onUnitChange={handleUnitChange} />
      ) : (
        <RaiseRequestForm selectedUnit={selectedUnit} userId={userId} />
      )}
    </div>
  );
}

export default UnitSelectorPage;
