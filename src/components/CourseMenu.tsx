import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { Fragment } from 'react';
import { isLightColor } from '@/lib/utils';

interface CourseMenuProps {
  onDelete: () => void;
  backgroundColor?: string;
}

export function CourseMenu({ onDelete, backgroundColor = '#3B82F6' }: CourseMenuProps) {
  const isLight = isLightColor(backgroundColor);

  return (
    <Menu as="div" className="relative">
      <Menu.Button className={`flex items-center justify-center w-6 h-6 rounded ${
        isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'
      }`}>
        <EllipsisVerticalIcon className={`w-4 h-4 ${
          isLight ? 'text-gray-600' : 'text-white'
        }`} />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-1 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }: { active: boolean }) => (
                <button
                  onClick={onDelete}
                  className={`${
                    active ? 'bg-red-50 text-red-700' : 'text-red-600'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  Delete
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 