import React from 'react';
import { ArrowRight, Info } from 'lucide-react';
import './styles.scss';

const DeltaView = ({ delta }) => {
  if (!delta || typeof delta !== 'object') return null;

  const renderValue = (val) => {
    if (typeof val === 'object' && val !== null) {
      if ('old' in val && 'new' in val) {
        return (
          <div className="comparisonValue">
            <span className="oldVal">{val.old}</span>
            <ArrowRight size={14} className="arrow" />
            <span className="newVal">{val.new}</span>
          </div>
        );
      }
      return JSON.stringify(val);
    }
    return <span className="simpleVal">{String(val)}</span>;
  };

  const formatKey = (key) => {
    // Convert camelCase to Title Case
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  return (
    <div className="deltaContainer">
      <div className="deltaHeader">
        <Info size={16} />
        <span>Delta Analysis</span>
      </div>
      <div className="deltaGrid">
        {Object.entries(delta).map(([key, value]) => (
          <div key={key} className="deltaRow">
            <div className="deltaKey">{formatKey(key)}</div>
            <div className="deltaValue">{renderValue(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeltaView;
