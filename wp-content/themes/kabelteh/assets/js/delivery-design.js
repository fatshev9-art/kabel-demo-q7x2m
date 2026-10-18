/* Progressive direction selector. Every destination is a real source country/city page. */
(function () {
  'use strict';
  var data = document.getElementById('delivery-direction-data');
  var controls = document.querySelector('.delivery-selector-controls');
  var country = document.getElementById('delivery-country');
  var city = document.getElementById('delivery-city');
  var link = document.getElementById('delivery-direction-link');
  var status = document.getElementById('delivery-direction-status');
  var countryList = document.getElementById('delivery-country-list');
  var countries;
  try { countries = JSON.parse(data.textContent); } catch (error) { return; }
  if (!Array.isArray(countries) || !countries.length || !controls || !country || !city || !link || !status || !countryList) return;
  function option(value, label) {
    var node = document.createElement('option'); node.value = value; node.textContent = label; return node;
  }
  function selectedCountry() { return countries.find(function (item) { return item.slug === country.value; }); }
  function updateLink() {
    var item = selectedCountry();
    var destination = item && item.cities.find(function (entry) { return entry.slug === city.value; });
    if (destination) {
      link.href = destination.url; link.textContent = 'Условия: ' + destination.name;
      status.textContent = 'Выбрано направление: ' + item.name + ', ' + destination.name + '.';
    } else if (item) {
      link.href = item.url; link.textContent = 'Условия: ' + item.name;
      status.textContent = 'Выбрана страна: ' + item.name + '. Можно уточнить город.';
    } else {
      link.href = '#delivery-country-list'; link.textContent = 'Все направления';
      status.textContent = 'Выберите страну и город, чтобы открыть условия направления.';
    }
  }
  function updateCities() {
    var item = selectedCountry(); city.replaceChildren();
    city.disabled = !item;
    city.append(option('', item ? 'Все города страны' : 'Сначала выберите страну'));
    if (item) item.cities.forEach(function (entry) { city.append(option(entry.slug, entry.name)); });
    updateLink();
  }
  country.addEventListener('change', updateCities);
  city.addEventListener('change', updateLink);
  link.addEventListener('click', function () {
    if (!selectedCountry()) countryList.open = true;
  });
  countryList.open = false;
  controls.hidden = false;
  updateCities();
})();
