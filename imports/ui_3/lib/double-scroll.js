import { $ } from 'meteor/jquery';

export function doubleScroll(element) {
  element.wrap($('<div>', { class: 'ds-div2' }));
  const div2 = element.parent();
  div2.wrap($('<div>', { class: 'ds-wrapper2' }));
  const wrapper2 = div2.parent();
  const wrapper1 = $('<div class="ds-wrapper1"></div>').insertBefore('.ds-wrapper2');
  wrapper1.append('<div class="ds-div1"></div>');
  const div1 = wrapper1.children().first();

  wrapper1.css({
    'width': '100%',
    'overflow-x': 'scroll',
    'overflow-y': 'hidden',
    'height': '20px',
  });

  wrapper2.css({
    'width': '100%',
    'overflow-x': 'scroll',
    'overflow-y': 'hidden',
  });

  div1.css({
    'width': `${element.width()}`,
    'height': '20px'
  });

  div2.css({
    'overflow': 'none'
  });

  wrapper1.on('scroll', function () {
    wrapper2.scrollLeft(wrapper1.scrollLeft());
  });

  wrapper2.on('scroll', function () {
    wrapper1.scrollLeft(wrapper2.scrollLeft());
  });
}
