(function () {
  var upcomingContainer = document.querySelector('[data-upcoming-concerts]');
  var pastSection = document.querySelector('[data-past-concerts]');
  var pastContainer = document.querySelector('[data-past-concert-list]');
  var homeDetail = document.querySelector('[data-home-concert-detail]');

  if (!upcomingContainer && !homeDetail) return;

  var csvUrl = window.CONCERTS_CSV_URL;
  var inquiriesUrl = 'mailto:Email@RamneekSingh.com';

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

    row.push(cell);
    if (row.some(function (value) { return value.trim() !== ''; })) rows.push(row);
    if (!rows.length) return [];

    var headers = rows[0].map(function (header) {
      return header.replace(/^\uFEFF/, '').trim().toLowerCase();
    });

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
    var us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    var date;

    if (iso) {
      date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    } else if (us) {
      date = new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
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

  function safeLink(value) {
    if (!value) return '';
    try {
      var url = new URL(value, window.location.href);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  function normalizeConcerts(records) {
    return records.map(function (record) {
      var rawDate = firstValue(record, ['concert date', 'date']);
      var date = parseDate(rawDate);
      var location = firstValue(record, ['location', 'city / venue', 'venue', 'city']);
      if (!date || !location) return null;

      return {
        date: date,
        location: location,
        description: firstValue(record, ['description', 'event description']),
        ticketUrl: safeLink(firstValue(record, ['ticket url', 'ticket / details url', 'event url', 'link']))
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

    if (isUpcoming) {
      var link = document.createElement('a');
      link.className = 'btn btn-outline';
      link.href = concert.ticketUrl || inquiriesUrl;
      link.textContent = concert.ticketUrl ? 'Event details and tickets' : 'Performance inquiries';
      if (concert.ticketUrl) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      card.appendChild(link);
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

  fetch(csvUrl, { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('Concert spreadsheet request failed: ' + response.status);
      return response.text();
    })
    .then(function (text) { render(normalizeConcerts(parseCsv(text))); })
    .catch(showError);
}());
