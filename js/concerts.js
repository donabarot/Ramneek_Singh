(function () {
  var upcomingContainer = document.querySelector('[data-upcoming-concerts]');
  var pastSection = document.querySelector('[data-past-concerts]');
  var pastContainer = document.querySelector('[data-past-concert-list]');
  var homeDetail = document.querySelector('[data-home-concert-detail]');

  if (!upcomingContainer && !homeDetail) return;

  var csvUrl = window.CONCERTS_CSV_URL;
  var bookingEmail = 'Email@RamneekSingh.com';

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var cell = '';
    var quoted = false;

    for (var i = 0; i < text.length; i += 1) {
      var character = text[i];
      if (quoted) {
        if (character === '"' && text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          cell += character;
        }
      } else if (character === '"') {
        quoted = true;
      } else if (character === ',') {
        row.push(cell);
        cell = '';
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && text[i + 1] === '\n') i += 1;
        row.push(cell);
        if (row.some(function (value) { return value.trim() !== ''; })) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += character;
      }
    }

    if (quoted) throw new Error('The concert spreadsheet contains an unfinished quoted field.');
    row.push(cell);
    if (row.some(function (value) { return value.trim() !== ''; })) rows.push(row);
    if (!rows.length) return [];

    var headers = rows[0].map(function (header) {
      var normalized = header.replace(/^\uFEFF/, '').trim().toLowerCase();
      if (normalized.indexOf('concert date') === 0 || normalized === 'date') return 'concert date';
      if (normalized.indexOf('location') === 0 || normalized === 'city / venue' ||
          normalized === 'venue' || normalized === 'city') return 'location';
      if (normalized.indexOf('description') === 0) return 'description';
      if (normalized.indexOf('ticket price') === 0 || normalized.indexOf('ticket amount') === 0 ||
          normalized === 'price') return 'ticket price';
      return normalized;
    });
    var hasDate = headers.indexOf('concert date') !== -1;
    var hasLocation = headers.indexOf('location') !== -1;
    if (!hasDate || !hasLocation) {
      throw new Error('The concert spreadsheet needs Concert date and Location columns.');
    }

    return rows.slice(1).map(function (values) {
      var record = {};
      headers.forEach(function (header, index) {
        record[header] = (values[index] || '').trim();
      });
      return record;
    });
  }

  function parseDate(value) {
    var trimmed = value.trim();
    var iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    var slashDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    var date;

    if (iso) {
      date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      if (date.getFullYear() !== Number(iso[1]) ||
          date.getMonth() !== Number(iso[2]) - 1 ||
          date.getDate() !== Number(iso[3])) return null;
    } else if (slashDate) {
      var first = Number(slashDate[1]);
      var second = Number(slashDate[2]);
      var day = first > 12 || second <= 12 ? first : second;
      var month = first > 12 || second <= 12 ? second : first;
      var year = Number(slashDate[3]);
      date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day) return null;
    } else {
      date = new Date(trimmed);
      if (!Number.isNaN(date.getTime())) {
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }
    }

    if (Number.isNaN(date.getTime())) return null;
    if (date.getFullYear() < 1000 || date.getMonth() < 0 || date.getMonth() > 11) return null;
    return date;
  }

  function firstValue(record, names) {
    for (var i = 0; i < names.length; i += 1) {
      if (record[names[i]]) return record[names[i]];
    }
    return '';
  }

  function getCsvUrl(value) {
    var url = new URL(value, window.location.href);
    if (url.hostname === 'docs.google.com' && /\/pubhtml$/.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/pubhtml$/, '/pub');
      url.searchParams.set('output', 'csv');
    }
    return url.href;
  }

  function normalizeConcerts(records) {
    return records.map(function (record) {
      var rawDate = firstValue(record, ['concert date', 'date']);
      var date = parseDate(rawDate);
      var location = firstValue(record, ['location', 'city / venue', 'venue', 'city']);
      if (!date || !location) {
        throw new Error('A concert row is missing a valid date or location.');
      }

      return {
        date: date,
        location: location,
        description: firstValue(record, ['description', 'event description']),
        ticketPrice: firstValue(record, ['ticket price', 'ticket amount', 'price'])
      };
    }).filter(Boolean);
  }

  function makeCard(concert, isUpcoming, isNext) {
    var card = document.createElement('article');
    card.className = 'concert-card';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = isUpcoming ? (isNext ? 'Next performance' : 'Upcoming performance') : 'Past performance';

    var location = document.createElement('h2');
    location.textContent = concert.location;

    var date = document.createElement('p');
    date.className = 'concert-date';
    date.textContent = concert.date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    var ornament = document.createElement('div');
    ornament.className = 'ornament';
    ornament.setAttribute('aria-hidden', 'true');

    card.appendChild(eyebrow);
    card.appendChild(location);
    card.appendChild(date);
    card.appendChild(ornament);

    if (concert.description) {
      var description = document.createElement('p');
      description.className = 'concert-description';
      description.textContent = concert.description;
      card.appendChild(description);
    }

    if (concert.ticketPrice) {
      var price = document.createElement('p');
      price.className = 'concert-price';
      var priceLabel = document.createElement('strong');
      priceLabel.textContent = 'Ticket price: ';
      price.appendChild(priceLabel);
      price.appendChild(document.createTextNode(concert.ticketPrice));
      card.appendChild(price);
    }

    if (isUpcoming) {
      var bookingNote = document.createElement('p');
      bookingNote.className = 'concert-booking-note';
      bookingNote.appendChild(document.createTextNode('To book or confirm your tickets, please email '));
      var emailLink = document.createElement('a');
      emailLink.href = 'mailto:' + bookingEmail;
      emailLink.textContent = bookingEmail;
      bookingNote.appendChild(emailLink);
      bookingNote.appendChild(document.createTextNode('.'));
      card.appendChild(bookingNote);
    }
    return card;
  }

  function render(concerts) {
    var today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    var upcoming = concerts.filter(function (concert) { return concert.date >= today; });
    var past = concerts.filter(function (concert) { return concert.date < today; });
    upcoming.sort(function (a, b) { return a.date - b.date; });
    past.sort(function (a, b) { return b.date - a.date; });

    if (upcomingContainer) {
      upcomingContainer.replaceChildren();
      if (!upcoming.length) {
        var empty = document.createElement('p');
        empty.className = 'concert-status';
        empty.textContent = 'No upcoming concerts have been announced. Please check back soon.';
        upcomingContainer.appendChild(empty);
      } else {
        upcoming.forEach(function (concert, index) {
          upcomingContainer.appendChild(makeCard(concert, true, index === 0));
        });
      }
    }

    if (pastContainer && pastSection) {
      pastContainer.replaceChildren();
      past.forEach(function (concert) {
        pastContainer.appendChild(makeCard(concert, false, false));
      });
      pastSection.hidden = past.length === 0;
    }

    if (homeDetail) {
      if (upcoming.length) {
        homeDetail.replaceChildren();
        homeDetail.appendChild(document.createTextNode(
          upcoming[0].date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) + ' '
        ));
        var separator = document.createElement('span');
        separator.setAttribute('aria-hidden', 'true');
        separator.textContent = '·';
        homeDetail.appendChild(separator);
        homeDetail.appendChild(document.createTextNode(' ' + upcoming[0].location));
      } else {
        homeDetail.textContent = 'No upcoming performances announced';
      }
    }
  }

  function showError(error) {
    console.error('Unable to load concert listings.', error);
    if (upcomingContainer) {
      upcomingContainer.textContent = 'Concert listings are temporarily unavailable. Please check back soon.';
    }
    if (homeDetail) homeDetail.textContent = 'Concert listings are temporarily unavailable';
  }

  if (!csvUrl) {
    render([]);
    return;
  }

  fetch(getCsvUrl(csvUrl), { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('Concert spreadsheet request failed: ' + response.status);
      return response.text();
    })
    .then(function (text) { render(normalizeConcerts(parseCsv(text))); })
    .catch(showError);
}());
