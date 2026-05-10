import React from 'react';
import { ArrowRight, Info } from 'lucide-react';
import './styles.scss';

const DeltaView = ({ delta }) => {
  if (!delta || typeof delta !== 'object') return null;

  const tryParseJSON = (str) => {
    if (typeof str !== 'string') return str;
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {
      // Not a JSON string
    }
    return str;
  };

  const renderValue = (val) => {
    const data = tryParseJSON(val);

    if (Array.isArray(data)) {
      return (
        <div className="deltaList">
          {data.map((item, idx) => (
            <div key={idx} className="deltaListItem">
              {Object.entries(item).map(([k, v]) => (
                <div key={k} className="listItemField">
                  <span className="fieldLabel">{k.charAt(0).toUpperCase() + k.slice(1)}:</span>
                  <span className="fieldValue">
                    {k === 'url' ? (
                      <a href={v} target="_blank" rel="noopener noreferrer">View Original</a>
                    ) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (typeof data === 'object' && data !== null) {
      if ('old' in data && 'new' in data) {
        return (
          <div className="comparisonValue">
            <span className="oldVal">{data.old}</span>
            <ArrowRight size={14} className="arrow" />
            <span className="newVal">{data.new}</span>
          </div>
        );
      }
      return <pre className="jsonVal">{JSON.stringify(data, null, 2)}</pre>;
    }
    
    return <span className="simpleVal">{String(data)}</span>;
  };

  const formatKey = (key) => {
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
        {Object.entries(delta).map(([key, value]) => {
          const data = tryParseJSON(value);
          const isList = Array.isArray(data);
          
          return (
            <div key={key} className={`deltaRow ${isList ? 'deltaRow--list' : ''}`}>
              <div className="deltaKey">{formatKey(key)}</div>
              <div className="deltaValue">{renderValue(value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeltaView;
