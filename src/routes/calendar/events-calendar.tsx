import type { CalendarDate } from "@internationalized/date";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useDateFormatter } from "react-aria";
import {
	CalendarCell,
	CalendarGrid,
	CalendarGridBody,
	CalendarGridHeader,
	CalendarHeaderCell,
	Heading,
	Calendar as RacCalendar,
} from "react-aria-components";
import { useNavigate, useParams } from "react-router-dom";
import TablerArrowBigLeft from "virtual:icons/tabler/arrow-big-left";
import TablerArrowBigRight from "virtual:icons/tabler/arrow-big-right";
import TablerCalendar from "virtual:icons/tabler/calendar";
import TablerPencil from "virtual:icons/tabler/pencil";
import TablerTrash from "virtual:icons/tabler/trash";

import type { EventEntry } from "#/lib/data";

import { EventForm } from "#/components/event-form";
import { Button } from "#/components/ui/button";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "#/components/ui/dialog";
import { addEventDeletionNotification } from "#/components/ui/toast";
import { deleteEvent, restoreEvent, useEventsCountForDate, useEventsForDate } from "#/lib/data";
import { css } from "#/utils/css";
import {
	convertCalendarDateToDate,
	convertIsoStringToZonedDateTime,
	getCurrentCalendarDate,
	parseDateParts,
} from "#/utils/date";

const HeaderRow = () => (
	<CalendarGridHeader style={css({ "--min-h": "var(--scale_8)" })}>
		{day => (
			<CalendarHeaderCell
				style={css({
					"--w": "var(---, calc(100% / 7))",
				})}
			>
				<span
					style={css({
						"--align-items": "center",
						"--color": "var(--color_orange-12)",
						"--display": "flex",
						"--font-size": "var(--font-size_xs)",
						"--font-weight": "var(--weight_semibold)",
						"--justify-content": "flex-end",
						"--m": "var(---, 3px)",
						"--min-h": "var(--scale_8)",
						"--p": "var(--scale_2)",
						"--xs_font-size": "var(--font-size_base)",
						"--xs_m": "var(--scale_1-5)",
						"--xs_p": "var(--scale_2-5)",
					})}
				>
					{day}
				</span>
			</CalendarHeaderCell>
		)}
	</CalendarGridHeader>
);

const DayCell = ({ date }: { date: CalendarDate }) => {
	const eventsForDate = useEventsCountForDate(date) ?? 0;

	return (
		<CalendarCell
			style={css({
				"--border-radius": "var(--radii_md)",
				"--display": "flex",
				"--flex-dir": "column",
				"--m": "var(---, 3px)",
				"--min-h": "var(--scale_16)",
				"--outline": "none",
				"--outline-color": "var(--color_blue-8)",
				"--outline-offset": "var(--scale_px)",
				"--outline-width": "var(--scale_0-5)",
				"--p": "var(--scale_2)",
				"--rac-focus-visible_outline-style": "var(--line-style_solid)",
				"--rac-hover_bg-color": "var(--color_sand-4)",
				"--rac-outside-month_color": "var(--color_sand-10)",
				"--rac-selected_bg-color": "var(--color_orange-5)",
				"--transition-duration": "var(--transition-duration_150)",
				"--transition-property": "background-color",
				"--transition-timing-function": "var(--transition-timing-function_ease-in-out)",
				"--xs_m": "var(--scale_1-5)",
				"--xs_p": "var(--scale_2-5)",
				"--xs_rac-focus-visible_outline-offset": "var(--scale_0-5)",
				...(date.toDate("utc").getDay() % 6 === 0 && {
					"--bg-color": "var(--color_sand-2)",
				}),
			})}
			date={date}
		>
			{({ formattedDate }) => (
				<>
					<span
						style={css({
							"--font-size": "var(--font-size_sm)",
							"--text-align": "right",
							"--xs_font-size": "var(--font-size_lg)",
						})}
					>
						{formattedDate}
					</span>
					{eventsForDate > 0 && (
						<div
							style={css({
								"--align-items": "center",
								"--display": "flex",
								"--mt": "var(---, auto)",
							})}
						>
							{/* TODO: Indicate somehow that ther're more events */}
							{Array.from({ length: Math.min(eventsForDate, 4) }).map((_, index) => (
								<span
									style={css({
										"--bg-color": "var(--color_orange-9)",
										"--border-radius": "var(--radii_full)",
										"--h": "var(--scale_2)",
										"--mr": "var(---, -3px)",
										"--w": "var(--scale_2)",
									})}
									key={index}
								/>
							))}
						</div>
					)}
				</>
			)}
		</CalendarCell>
	);
};

const Header = () => (
	<header style={css({ "--align-items": "center", "--display": "flex", "--justify-content": "space-between" })}>
		<Button slot="previous" variant="muted">
			<TablerArrowBigLeft />
		</Button>
		<Heading
			style={css({
				"--color": "var(--color_orange-12)",
				"--font-size": "var(--font-size_xl)",
				"--font-weight": "var(--weight_semibold)",
			})}
		/>
		<Button slot="next" variant="muted">
			<TablerArrowBigRight />
		</Button>
	</header>
);

const Calendar = ({ date, onDateChange }: { date: CalendarDate; onDateChange: (date: CalendarDate) => void }) => {
	const [focusedDate, setFocusedDate] = useState(date);

	// TODO: Maybe this one could be solved in a better way
	useEffect(() => {
		setFocusedDate(date);
	}, [date]);

	return (
		<RacCalendar
			style={css({
				"--display": "flex",
				"--flex-dir": "column",
				"--gap": "var(--scale_4)",
				"--w": "var(--size_full)",
			})}
			aria-label="Events"
			defaultFocusedValue={date}
			focusedValue={focusedDate}
			onChange={onDateChange}
			onFocusChange={setFocusedDate}
			value={date}
		>
			<Header />
			<CalendarGrid
				style={css({
					"--table-layout": "fixed",
				})}
				weekdayStyle="short"
			>
				<HeaderRow />
				<CalendarGridBody>{date => <DayCell date={date} />}</CalendarGridBody>
			</CalendarGrid>
		</RacCalendar>
	);
};

const Event = ({ event }: { event: EventEntry }) => {
	const formatter = useDateFormatter({
		dateStyle: "short",
		timeStyle: "short",
	});

	const handleEventDelete = async () => {
		await deleteEvent(event.id);

		addEventDeletionNotification({
			name: event.name,
			onRestore: async () => {
				await restoreEvent(event);
			},
		});
	};

	return (
		<li style={css({ "--display": "flex", "--flex-dir": "column", "--gap": "var(--scale_4)" })}>
			<div
				style={css({
					"--align-items": "center",
					"--display": "flex",
					"--flex-wrap": "wrap",
					"--gap": "var(--scale_3)",
					"--justify-content": "space-between",
				})}
			>
				<h3 style={css({ "--font-size": "var(--font-size_2xl)", "--font-weight": "var(--weight_medium)" })}>
					{event.name}
				</h3>
				<p>
					{formatter.format(convertIsoStringToZonedDateTime(event.startDate).toDate())} -{" "}
					{formatter.format(convertIsoStringToZonedDateTime(event.endDate).toDate())}
				</p>
			</div>
			<p>{event.description}</p>
			<div
				style={css({
					"--align-items": "center",
					"--display": "flex",
					"--gap": "var(--scale_3)",
					"--justify-content": "flex-end",
				})}
			>
				<Button onPress={handleEventDelete} variant="negative">
					Delete event <TablerTrash />
				</Button>
				<DialogTrigger>
					<Button>
						Edit event <TablerPencil />
					</Button>
					<ModalOverlay>
						<Modal>
							<Dialog>{({ close }) => <EventForm event={event} onCancel={close} onComplete={close} />}</Dialog>
						</Modal>
					</ModalOverlay>
				</DialogTrigger>
			</div>
		</li>
	);
};

const List = ({ date }: { date: CalendarDate }) => {
	const formatter = useDateFormatter();
	const navigate = useNavigate();

	const { eventsForDate, eventsFromFuture } = useEventsForDate(date) ?? { eventsForDate: [], eventsFromFuture: [] };

	const navigateToToday = () => {
		const currentDate = getCurrentCalendarDate();

		navigate(`/${currentDate.year}/${currentDate.month}/${currentDate.day}`);
	};

	return (
		<div
			style={css({
				"--display": "flex",
				"--flex-dir": "column",
				"--gap": "var(--scale_8)",
				"--w": "var(--size_full)",
			})}
		>
			<div
				style={css({
					"--align-items": "center",
					"--display": "flex",
					"--gap": "var(--scale_3)",
					"--justify-content": "space-between",
				})}
			>
				<h2
					style={css({
						"--font-size": "var(--font-size_2xl)",
						"--font-weight": "var(--weight_semibold)",
						"--xs_font-size": "var(--font-size_3xl)",
					})}
				>
					Events for {formatter.format(convertCalendarDateToDate(date))}
				</h2>
				<Button onPress={navigateToToday} style={css({ "--white-space": "nowrap" })} variant="muted">
					Go to today
					<TablerCalendar />
				</Button>
			</div>
			{eventsForDate.length > 0 ? (
				<ul style={css({ "--display": "flex", "--flex-dir": "column", "--gap": "var(--scale_4)" })}>
					{eventsForDate.map(event => (
						<Event event={event} key={event.id} />
					))}
				</ul>
			) : (
				<p style={css({ "--color": "var(--color_sand-11)" })}>No events for selected date</p>
			)}
			{eventsFromFuture.length > 0 && (
				<>
					<h2
						style={css({
							"--font-size": "var(--font-size_2xl)",
							"--font-weight": "var(--weight_semibold)",
							"--xs_font-size": "var(--font-size_3xl)",
						})}
					>
						Events for near future
					</h2>
					<ul style={css({ "--display": "flex", "--flex-dir": "column", "--gap": "var(--scale_4)" })}>
						{eventsFromFuture.map(event => (
							<Event event={event} key={event.id} />
						))}
					</ul>
				</>
			)}
		</div>
	);
};

const useParsedDate = () => {
	const { day, month, year } = useParams();

	const parsedDate = useMemo(() => parseDateParts(year, month, day), [day, month, year]);

	return parsedDate;
};

const useCalendarDate = () => {
	const navigate = useNavigate();
	const parsedDate = useParsedDate();

	const currentDate = getCurrentCalendarDate();

	// Using useLayoutEffect instead of using navigate during rendering because we shouldn't update parent state in render
	useLayoutEffect(() => {
		if (!parsedDate) navigate(`/${currentDate.year}/${currentDate.month}/${currentDate.day}`);
	}, [parsedDate, navigate, currentDate]);

	return parsedDate ?? currentDate;
};

export const EventsCalendar = () => {
	const navigate = useNavigate();
	const date = useCalendarDate();

	const navigateToDate = (date: CalendarDate) => {
		navigate(`/${date.year}/${date.month}/${date.day}`);
	};

	return (
		<div
			style={css({
				"--display": "flex",
				"--flex-dir": "column",
				"--gap": "var(--scale_8)",
			})}
		>
			<Calendar date={date} onDateChange={navigateToDate} />
			<List date={date} />
		</div>
	);
};
