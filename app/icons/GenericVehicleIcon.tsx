// components/icons/vehicle-icons/GenericVehicleIcon.tsx

const GenericVehicleIcon = ({ className = "w-6 h-6 text-white" }: { className?: string }) => {
    return (
        
        <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
            d="M499.5,385.4L308.9,57.2c-31.8-52.9-74.1-52.9-105.9,0L12.5,385.4c-31.8,52.9,0,95.3,63.5,95.3h360 C499.5,480.7,531.3,438.3,499.5,385.4z M298.4,438.3h-84.7v-84.7h84.7V438.3z M298.4,311.3h-84.7V120.7h84.7V311.3z" 
            fill="currentColor"
        />
    </svg>
    );
};

export default GenericVehicleIcon;
