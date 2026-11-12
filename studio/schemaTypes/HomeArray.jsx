import React, {useId, useState} from 'react';
import locations from './home-locations.json';

export function HomeArray(props) {
  const [region, setRegion] = useState('');
  const id = useId();
  const byKey = new Map((props.value ?? []).map(item => [item._key, locations[item.key] ?? 'Outros']));
  const regions = [...new Set(byKey.values())];
  const focused = props.focusPath?.[0]?._key;
  const members = region
    ? props.members.filter(member => member.key === focused || byKey.get(member.key) === region)
    : props.members;

  return <>
    {regions.length > 1 && <label htmlFor={id} style={{display: 'block', marginBottom: 12}}>
      Parte da página{' '}
      <select id={id} value={region} onChange={event => setRegion(event.target.value)}>
        <option value="">Todas</option>
        {regions.map(name => <option key={name}>{name}</option>)}
      </select>
    </label>}
    {props.renderDefault({...props, members})}
  </>;
}
