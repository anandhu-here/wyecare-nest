import { render } from '@testing-library/react';

import WebFeatures from './web-features';

describe('WebFeatures', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<WebFeatures />);
    expect(baseElement).toBeTruthy();
  });
});
